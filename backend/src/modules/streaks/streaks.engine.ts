// Pure scoring + streak logic. No database access: everything here is derived from the
// rows the service loads, so changing a setting or phase recalculates all history.

export type EntryStatus = 'DONE' | 'NA';
// PRODUCTIVE is a "Productive Day"; WELL_SPENT is the manual "day well spent" mark.
export type DayResult = 'PRODUCTIVE' | 'WELL_SPENT' | 'PLAN_C_OK' | 'NOT_YET';

export interface EngineSettings {
  startDate: string;
  // Share of the day's Anchor habits to do for a productive day (and for a Plan C day: planCThreshold).
  productiveThreshold: number;
  planCThreshold: number;
  weeklyGoal: number;
  // Habits to do from the Body and Brain groups for a productive day.
  bodyNeeded: number;
  brainNeeded: number;
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
  // "YYYY-MM-DD": the habit counts toward the day's total from this date. null = from the beginning.
  startDate: string | null;
  // 1-5: how much the habit weighs in the daily score.
  points: number;
  // Days of the week it is scheduled (0 = Sunday .. 6 = Saturday). null = every day.
  weekdays: number[] | null;
  // "Do it N days a week" (any days, Monday to Sunday). Replaces the weekday schedule when set.
  weeklyTarget: number | null;
}

export interface DayRecord {
  date: string;
  plan: string;
  notes: string | null;
  wellSpent?: boolean;
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
  wellSpent: boolean;
  entries: Record<number, EntryStatus>;
  logged: boolean;
  // Habits in play that day and how many are done.
  applicable: number;
  done: number;
  // The three checks of a productive day: most Anchor habits, enough Body, enough Brain.
  anchorDone: number;
  anchorNeeded: number;
  anchorTotal: number;
  bodyDone: number;
  bodyNeeded: number;
  brainDone: number;
  brainNeeded: number;
  score: number | null;
  result: DayResult | null;
  // Habits that are part of this day's total, and how many times each weekly-target habit is done
  // so far this week (this day included).
  inPlay: number[];
  weeklyDone: Record<number, number>;
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

// A habit counts toward a day's total once it has been added (its start date has been reached).
export const countsOn = (habit: EngineHabit, date: string) => !habit.startDate || habit.startDate <= date;

export const weekdayIndex = (ymd: string) => new Date(toDayNumber(ymd) * 86400000).getUTCDay();

// Is the habit scheduled on this date? (e.g. Office only on Monday to Friday)
export const scheduledOn = (habit: EngineHabit, date: string) =>
  !habit.weekdays || habit.weekdays.includes(weekdayIndex(date));

// A habit is part of a day's total when it has been added and is scheduled that day. Logging it as
// done on an unscheduled day also counts (that is how you add a one-off date, e.g. a Saturday at the office).
//
// A weekly-target habit ("3 days a week") is a bonus: it is in play on a day only when it is done.
export const weekStart = (ymd: string) => addDays(ymd, -((weekdayIndex(ymd) + 6) % 7));

export const inPlay = (habit: EngineHabit, date: string, status: EntryStatus | undefined) => {
  if (!countsOn(habit, date)) return false;
  if (habit.weeklyTarget) return status === 'DONE';
  return scheduledOn(habit, date) || status === 'DONE';
};

// For each weekly-target habit: how many times it was done earlier in the same week as `date`.
export function priorWeeklyDone(date: string, records: Map<string, DayRecord>, ctx: EngineContext) {
  const prior: Record<number, number> = {};
  const weekly = ctx.habits.filter((h) => h.weeklyTarget);
  if (weekly.length === 0) return prior;
  const start = weekStart(date);
  for (const h of weekly) {
    let count = 0;
    for (let d = start; d < date; d = addDays(d, 1)) {
      if (records.get(d)?.entries[h.id] === 'DONE') count++;
    }
    prior[h.id] = count;
  }
  return prior;
}

// ROUNDUP(threshold * count) with a small epsilon so 0.7 * 10 does not become 8.
function roundUpShare(threshold: number, count: number): number {
  return Math.ceil(threshold * count - 1e-9);
}

export function scoreDay(
  date: string,
  record: DayRecord | undefined,
  ctx: EngineContext,
  prior: Record<number, number> = {}
): DayScore {
  const week = weekOf(date, ctx.settings.startDate);
  const phase = phaseForWeek(week, ctx.phases);
  const plan = record?.plan || 'A';

  const entries: Record<number, EntryStatus> = {};
  if (record) {
    for (const h of ctx.habits) {
      const status = record.entries[h.id];
      if (status) entries[h.id] = status;
    }
  }
  const hasEntries = Object.keys(entries).length > 0;
  const wellSpent = record?.wellSpent === true;
  // A day marked well spent counts as logged even when no habit was ticked (a trip, say).
  const logged = hasEntries || wellSpent;

  // Three checks per day. Anchor: a share of that day's Anchor habits. Body and Brain: a minimum number of
  // habits (never more than the group has available that day). "Not applicable" habits drop out; weekly-target
  // habits are bonuses that count when done but are never required.
  const groups = {
    ANCHOR: { done: 0, required: 0, capable: 0 },
    BODY: { done: 0, required: 0, capable: 0 },
    BRAIN: { done: 0, required: 0, capable: 0 },
  };
  let applicable = 0;
  let done = 0;
  const inPlayIds: number[] = [];
  const weeklyDone: Record<number, number> = {};
  for (const h of ctx.habits) {
    const status = entries[h.id];
    if (h.weeklyTarget) weeklyDone[h.id] = (prior[h.id] ?? 0) + (status === 'DONE' ? 1 : 0);
    if (inPlay(h, date, status)) {
      inPlayIds.push(h.id);
      if (status !== 'NA') applicable++;
    }
    if (!countsOn(h, date) || status === 'NA') continue;
    const scheduled = !h.weeklyTarget && scheduledOn(h, date);
    if (!scheduled && !h.weeklyTarget && status !== 'DONE') continue;
    const g = groups[h.group as keyof typeof groups] ?? groups.ANCHOR;
    g.capable++;
    if (scheduled) g.required++;
    if (status === 'DONE') {
      g.done++;
      done++;
    }
  }
  const anchorNeeded = roundUpShare(ctx.settings.productiveThreshold, groups.ANCHOR.required);
  const bodyNeeded = Math.min(ctx.settings.bodyNeeded, groups.BODY.capable);
  const brainNeeded = Math.min(ctx.settings.brainNeeded, groups.BRAIN.capable);

  let result: DayResult | null = null;
  if (logged) {
    if (groups.ANCHOR.done >= anchorNeeded && groups.BODY.done >= bodyNeeded && groups.BRAIN.done >= brainNeeded) {
      result = 'PRODUCTIVE';
    } else if (wellSpent) {
      result = 'WELL_SPENT';
    } else if (plan === 'C' && groups.ANCHOR.done >= roundUpShare(ctx.settings.planCThreshold, groups.ANCHOR.required)) {
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
    wellSpent,
    entries,
    logged,
    applicable,
    done,
    anchorDone: groups.ANCHOR.done,
    anchorNeeded,
    anchorTotal: groups.ANCHOR.required,
    bodyDone: groups.BODY.done,
    bodyNeeded,
    brainDone: groups.BRAIN.done,
    brainNeeded,
    score: hasEntries && applicable > 0 ? done / applicable : null,
    result,
    inPlay: inPlayIds,
    weeklyDone,
  };
}

// ─── Streaks ────────────────────────────────────────────────
// Rules: a past day that is not good breaks the streak (blank = missed). Today never breaks
// a streak, because the day is still open. "Not applicable" days are skipped.

const isGood = (r: DayResult | null) => r === 'PRODUCTIVE' || r === 'WELL_SPENT' || r === 'PLAN_C_OK';

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

// A weekly-target habit's streak counts weeks (Monday to Sunday) in which the target was met. The
// current week extends it once the target is reached and never breaks it while the week is open.
function weeklyHabitStreak(habit: EngineHabit, scores: DayScore[], today: string) {
  const target = habit.weeklyTarget as number;
  const byWeek = new Map<string, number>();
  for (const s of scores) {
    const key = weekStart(s.date);
    byWeek.set(key, (byWeek.get(key) ?? 0) + (s.entries[habit.id] === 'DONE' ? 1 : 0));
  }
  const thisWeek = weekStart(today);
  let run = 0;
  let best = 0;
  for (const [week, count] of Array.from(byWeek.entries()).sort()) {
    if (count >= target) {
      run++;
      best = Math.max(best, run);
    } else if (week !== thisWeek) {
      run = 0;
    }
  }
  return { current: run, best };
}

export function habitStreak(habit: EngineHabit, scores: DayScore[], today: string) {
  if (habit.weeklyTarget) return weeklyHabitStreak(habit, scores, today);
  let run = 0;
  let best = 0;
  for (const s of scores) {
    const status = s.entries[habit.id];
    // Days the habit is not scheduled (e.g. Office on a weekend) neither extend nor break the streak.
    if (!scheduledOn(habit, s.date) && status !== 'DONE') continue;
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
    // Before the habit was added there is nothing to miss.
    else if (habit.weeklyTarget ? !s.inPlay.includes(habit.id) : !countsOn(habit, s.date) || !scheduledOn(habit, s.date)) {
      state = 'INACTIVE';
    }
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

  // "Good days": goals met or marked well spent.
  const productive = days.filter((s) => s.result === 'PRODUCTIVE' || s.result === 'WELL_SPENT').length;
  const planCOk = days.filter((s) => s.result === 'PLAN_C_OK').length;
  const notYet = days.filter((s) => s.result === 'NOT_YET').length;
  const loggedCount = productive + planCOk + notYet;

  const scored = loggedDays.filter((s) => s.score !== null);
  const avgScore = scored.length > 0 ? scored.reduce((sum, s) => sum + (s.score as number), 0) / scored.length : null;

  const habitRates: Record<number, number | null> = {};
  let weakest: { name: string; rate: number } | null = null;
  for (const h of ctx.habits) {
    // Only days on which the habit already counted are part of its rate.
    // Days with nothing ticked (e.g. a trip marked well spent) say nothing about a habit's hit rate.
    const relevant = days.filter((s) => Object.keys(s.entries).length > 0 && s.inPlay.includes(h.id));
    if (relevant.length === 0) {
      habitRates[h.id] = null;
      continue;
    }
    const doneCount = relevant.filter((s) => s.entries[h.id] === 'DONE').length;
    const naCount = relevant.filter((s) => s.entries[h.id] === 'NA').length;
    const denominator = relevant.length - naCount;
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
