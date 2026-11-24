// Pure scoring + streak logic. No database access: everything here is derived from the
// rows the service loads, so changing a setting or phase recalculates all history.

export type EntryStatus = 'DONE' | 'NA';
export type DayResult = 'PRODUCTIVE' | 'PLAN_C_OK' | 'NOT_YET';

export interface EngineSettings {
  startDate: string;
  productiveThreshold: number;
  planCThreshold: number;
  weeklyGoal: number;
}

export interface EnginePhase {
  phase: number;
  startsInWeek: number;
  brainNeeded: number;
}

export interface EngineHabit {
  id: number;
  name: string;
  group: string;
  activeFromPhase: number;
}

export interface DayRecord {
  date: string;
  plan: string;
  notes: string | null;
  entries: Record<number, EntryStatus>;
}

export interface EngineContext {
  settings: EngineSettings;
  phases: EnginePhase[]; // sorted by startsInWeek ascending
  habits: EngineHabit[]; // non-archived, in display order
}

export interface DayScore {
  date: string;
  weekday: string;
  week: number;
  phase: number;
  plan: string;
  notes: string | null;
  entries: Record<number, EntryStatus>;
  logged: boolean;
  applicable: number;
  done: number;
  needed: number;
  brainDone: number;
  brainNeeded: number;
  score: number | null;
  result: DayResult | null;
}

export type ChainState = DayResult | 'MISSED' | 'OPEN';
export type HabitChainState = 'DONE' | 'NA' | 'MISSED' | 'OPEN' | 'INACTIVE';

export interface WeekStats {
  week: number;
  start: string;
  end: string;
  phase: number;
  productive: number;
  planCOk: number;
  notYet: number;
  goalMet: boolean | null;
  avgScore: number | null;
  weakestHabit: string | null;
  habitRates: Record<number, number | null>;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Date helpers (calendar math on "YYYY-MM-DD", independent of timezone) ──

export function toDayNumber(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function fromDayNumber(n: number): string {
  return new Date(n * 86400000).toISOString().slice(0, 10);
}

export function addDays(ymd: string, days: number): string {
  return fromDayNumber(toDayNumber(ymd) + days);
}

export function weekdayOf(ymd: string): string {
  return WEEKDAYS[new Date(toDayNumber(ymd) * 86400000).getUTCDay()];
}

export function weekOf(ymd: string, startDate: string): number {
  return Math.floor((toDayNumber(ymd) - toDayNumber(startDate)) / 7) + 1;
}

export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let n = toDayNumber(from); n <= toDayNumber(to); n++) out.push(fromDayNumber(n));
  return out;
}

// ─── Phases and scoring ─────────────────────────────────────

export function phaseForWeek(week: number, phases: EnginePhase[]): EnginePhase {
  if (phases.length === 0) return { phase: 1, startsInWeek: 1, brainNeeded: 1 };
  let current = phases[0];
  for (const p of phases) {
    if (p.startsInWeek <= week) current = p;
  }
  return current;
}

// ROUNDUP(threshold * count) with a small epsilon so 0.7 * 10 does not become 8.
function roundUpShare(threshold: number, count: number): number {
  return Math.ceil(threshold * count - 1e-9);
}

export function scoreDay(date: string, record: DayRecord | undefined, ctx: EngineContext): DayScore {
  const week = weekOf(date, ctx.settings.startDate);
  const phase = phaseForWeek(week, ctx.phases);
  const plan = record?.plan || 'A';

  const activeHabits = ctx.habits.filter((h) => h.activeFromPhase <= phase.phase);
  const entries: Record<number, EntryStatus> = {};
  if (record) {
    for (const h of ctx.habits) {
      const status = record.entries[h.id];
      if (status) entries[h.id] = status;
    }
  }
  const logged = Object.keys(entries).length > 0;

  let notApplicable = 0;
  let done = 0;
  let brainDone = 0;
  for (const h of activeHabits) {
    const status = entries[h.id];
    if (status === 'NA') notApplicable++;
    if (status === 'DONE') {
      done++;
      if (h.group === 'BRAIN') brainDone++;
    }
  }

  const applicable = activeHabits.length - notApplicable;
  const needed = roundUpShare(ctx.settings.productiveThreshold, applicable);
  const brainNeeded = phase.brainNeeded;

  let result: DayResult | null = null;
  if (logged) {
    if (done >= needed && brainDone >= brainNeeded) {
      result = 'PRODUCTIVE';
    } else if (plan === 'C' && done >= roundUpShare(ctx.settings.planCThreshold, applicable)) {
      result = 'PLAN_C_OK';
    } else {
      result = 'NOT_YET';
    }
  }

  return {
    date,
    weekday: weekdayOf(date),
    week,
    phase: phase.phase,
    plan,
    notes: record?.notes ?? null,
    entries,
    logged,
    applicable,
    done,
    needed,
    brainDone,
    brainNeeded,
    score: logged && applicable > 0 ? done / applicable : null,
    result,
  };
}

// ─── Streaks ────────────────────────────────────────────────
// Rules: a past day that is not good breaks the streak (blank = missed). Today never breaks
// a streak, because the day is still open. "Not applicable" days are skipped.

const isGood = (r: DayResult | null) => r === 'PRODUCTIVE' || r === 'PLAN_C_OK';

export function overallStreak(scores: DayScore[], today: string) {
  let run = 0;
  let best = 0;
  for (const s of scores) {
    if (isGood(s.result)) {
      run++;
      best = Math.max(best, run);
    } else if (s.date !== today) {
      run = 0;
    }
  }
  return { current: run, best };
}

export function habitStreak(habit: EngineHabit, scores: DayScore[], today: string) {
  let run = 0;
  let best = 0;
  for (const s of scores) {
    const status = s.entries[habit.id];
    // A streak is consecutive days: a blank past day breaks it, even for a habit whose phase has not
    // started yet (those days still don't count toward the day's score, only toward this streak).
    if (status === 'DONE') {
      run++;
      best = Math.max(best, run);
    } else if (status === 'NA') {
      continue;
    } else if (s.date !== today) {
      run = 0;
    }
  }
  return { current: run, best };
}

export function overallChain(scores: DayScore[], today: string, length: number) {
  return scores.slice(-length).map((s) => {
    let state: ChainState;
    if (isGood(s.result)) state = s.result as DayResult;
    else if (s.date === today) state = 'OPEN';
    else state = s.result ?? 'MISSED';
    return { date: s.date, state };
  });
}

export function habitChain(habit: EngineHabit, scores: DayScore[], today: string, length: number) {
  return scores.slice(-length).map((s) => {
    let state: HabitChainState;
    if (s.entries[habit.id]) state = s.entries[habit.id];
    else if (habit.activeFromPhase > s.phase) state = 'INACTIVE';
    else state = s.date === today ? 'OPEN' : 'MISSED';
    return { date: s.date, state };
  });
}

// ─── Weekly review ──────────────────────────────────────────

export function weekStats(week: number, scores: DayScore[], ctx: EngineContext): WeekStats {
  const start = addDays(ctx.settings.startDate, (week - 1) * 7);
  const end = addDays(start, 6);
  const days = scores.filter((s) => s.date >= start && s.date <= end);
  const loggedDays = days.filter((s) => s.logged);
  const phase = phaseForWeek(week, ctx.phases).phase;

  const productive = days.filter((s) => s.result === 'PRODUCTIVE').length;
  const planCOk = days.filter((s) => s.result === 'PLAN_C_OK').length;
  const notYet = days.filter((s) => s.result === 'NOT_YET').length;
  const loggedCount = productive + planCOk + notYet;

  const scored = loggedDays.filter((s) => s.score !== null);
  const avgScore = scored.length > 0 ? scored.reduce((sum, s) => sum + (s.score as number), 0) / scored.length : null;

  const habitRates: Record<number, number | null> = {};
  let weakest: { name: string; rate: number } | null = null;
  for (const h of ctx.habits) {
    if (loggedCount === 0 || h.activeFromPhase > phase) {
      habitRates[h.id] = null;
      continue;
    }
    const doneCount = days.filter((s) => s.entries[h.id] === 'DONE').length;
    const naCount = days.filter((s) => s.entries[h.id] === 'NA').length;
    const denominator = loggedCount - naCount;
    const rate = denominator > 0 ? doneCount / denominator : null;
    habitRates[h.id] = rate;
    if (rate !== null && (weakest === null || rate < weakest.rate)) weakest = { name: h.name, rate };
  }

  return {
    week,
    start,
    end,
    phase,
    productive,
    planCOk,
    notYet,
    goalMet: loggedCount === 0 ? null : productive >= ctx.settings.weeklyGoal,
    avgScore,
    weakestHabit: weakest ? weakest.name : null,
    habitRates,
  };
}

export function weeklyGoalStreak(weeks: WeekStats[], currentWeek: number, goal: number) {
  let run = 0;
  let best = 0;
  for (const w of weeks) {
    if (w.week > currentWeek) break;
    if (w.productive >= goal) {
      run++;
      best = Math.max(best, run);
    } else if (w.week !== currentWeek) {
      run = 0;
    }
  }
  return { current: run, best };
}
