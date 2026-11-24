import dayjs from 'dayjs';
import prisma from '../../shared/db/prisma';
import {
  DayRecord,
  DayScore,
  EngineContext,
  EngineHabit,
  EnginePhase,
  EngineSettings,
  EntryStatus,
  addDays,
  dateRange,
  habitChain,
  habitStreak,
  overallChain,
  overallStreak,
  scoreDay,
  toDayNumber,
  weekOf,
  weekStats,
  weeklyGoalStreak,
} from './streaks.engine';
import {
  CreateHabitInput,
  ReplacePhasesInput,
  SaveDayInput,
  UpdateHabitInput,
  UpdateSettingsInput,
} from './streaks.types';

const CHAIN_LENGTH = 14;
const MAX_RANGE_DAYS = 400;

export const todayString = () => dayjs().format('YYYY-MM-DD');

// ─── Defaults (taken from the original habit tracker workbook) ───

const DEFAULT_PHASES = [
  { phase: 1, startsInWeek: 1, brainNeeded: 1, description: 'Wake and move: 12 habits' },
  { phase: 2, startsInWeek: 3, brainNeeded: 2, description: 'Jog, DSA, stock/venture: 15 habits' },
  { phase: 3, startsInWeek: 5, brainNeeded: 2, description: 'Workout, courses, no tea/coffee: 18 habits' },
  { phase: 4, startsInWeek: 9, brainNeeded: 2, description: 'System design: all 19 habits' },
];

const DEFAULT_HABITS: { name: string; group: string; activeFromPhase: number }[] = [
  { name: 'Wake before 8', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'Plan the day', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'Breakfast', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'Office', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'Lunch', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'Not home before 6', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'Walking', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'German', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'No tea/coffee', group: 'ANCHOR', activeFromPhase: 3 },
  { name: 'Screen < 3 h', group: 'ANCHOR', activeFromPhase: 1 },
  { name: 'Stretching', group: 'BODY', activeFromPhase: 1 },
  { name: 'Jogging', group: 'BODY', activeFromPhase: 2 },
  { name: 'Workout 20 min', group: 'BODY', activeFromPhase: 3 },
  { name: 'Pushups x10', group: 'BODY', activeFromPhase: 1 },
  { name: 'Stock/venture', group: 'BRAIN', activeFromPhase: 2 },
  { name: 'Courses', group: 'BRAIN', activeFromPhase: 3 },
  { name: 'LeetCode (no AI)', group: 'BRAIN', activeFromPhase: 1 },
  { name: 'DSA', group: 'BRAIN', activeFromPhase: 2 },
  { name: 'System design', group: 'BRAIN', activeFromPhase: 4 },
];

let defaultsReady = false;

// Creates the settings row, phases and habit list the first time the module is used.
export async function ensureDefaults() {
  if (defaultsReady) return;

  const settings = await prisma.habitSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.habitSettings.create({ data: { id: 1, startDate: todayString() } });
  }
  if ((await prisma.habitPhase.count()) === 0) {
    await prisma.habitPhase.createMany({ data: DEFAULT_PHASES });
  }
  if ((await prisma.habit.count()) === 0) {
    await prisma.habit.createMany({
      data: DEFAULT_HABITS.map((h, i) => ({ ...h, sortOrder: i })),
    });
  }
  defaultsReady = true;
}

// ─── Configuration ──────────────────────────────────────────

export async function getConfig() {
  await ensureDefaults();
  const [settings, phases, habits] = await Promise.all([
    prisma.habitSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.habitPhase.findMany({ orderBy: { startsInWeek: 'asc' } }),
    prisma.habit.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
  ]);
  return { settings, phases, habits };
}

export async function updateSettings(data: UpdateSettingsInput) {
  await ensureDefaults();
  const updateData: Record<string, unknown> = {};
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.productiveThreshold !== undefined) updateData.productiveThreshold = data.productiveThreshold;
  if (data.planCThreshold !== undefined) updateData.planCThreshold = data.planCThreshold;
  if (data.weeklyGoal !== undefined) updateData.weeklyGoal = data.weeklyGoal;
  if (data.gateEasy !== undefined) updateData.gateEasy = data.gateEasy;
  if (data.gateTotal !== undefined) updateData.gateTotal = data.gateTotal;
  if (data.gateMedium !== undefined) updateData.gateMedium = data.gateMedium;

  return prisma.habitSettings.update({ where: { id: 1 }, data: updateData });
}

export async function replacePhases(data: ReplacePhasesInput) {
  await ensureDefaults();
  await prisma.$transaction([
    prisma.habitPhase.deleteMany(),
    prisma.habitPhase.createMany({
      data: data.phases.map((p) => ({
        phase: p.phase,
        startsInWeek: p.startsInWeek,
        brainNeeded: p.brainNeeded,
        description: p.description ?? null,
      })),
    }),
  ]);
  return prisma.habitPhase.findMany({ orderBy: { startsInWeek: 'asc' } });
}

export async function createHabit(data: CreateHabitInput) {
  await ensureDefaults();
  const last = await prisma.habit.aggregate({ _max: { sortOrder: true } });
  return prisma.habit.create({
    data: {
      name: data.name,
      group: data.group,
      activeFromPhase: data.activeFromPhase ?? 1,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    },
  });
}

export async function updateHabit(id: number, data: UpdateHabitInput) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.group !== undefined) updateData.group = data.group;
  if (data.activeFromPhase !== undefined) updateData.activeFromPhase = data.activeFromPhase;
  if (data.archived !== undefined) updateData.archived = data.archived;

  return prisma.habit.update({ where: { id }, data: updateData });
}

export async function reorderHabits(ids: number[]) {
  await prisma.$transaction(
    ids.map((id, index) => prisma.habit.update({ where: { id }, data: { sortOrder: index } }))
  );
  return prisma.habit.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
}

// Deleting a habit also deletes its history (cascade). Archiving keeps it but stops it counting.
export async function deleteHabit(id: number) {
  return prisma.habit.delete({ where: { id } });
}

// ─── Loading the engine context ─────────────────────────────

async function loadContext(): Promise<EngineContext> {
  const { settings, phases, habits } = await getConfig();
  const engineSettings: EngineSettings = {
    startDate: settings.startDate,
    productiveThreshold: settings.productiveThreshold,
    planCThreshold: settings.planCThreshold,
    weeklyGoal: settings.weeklyGoal,
  };
  const enginePhases: EnginePhase[] = phases.map((p) => ({
    phase: p.phase,
    startsInWeek: p.startsInWeek,
    brainNeeded: p.brainNeeded,
  }));
  const engineHabits: EngineHabit[] = habits
    .filter((h) => !h.archived)
    .map((h) => ({ id: h.id, name: h.name, group: h.group, activeFromPhase: h.activeFromPhase }));
  return { settings: engineSettings, phases: enginePhases, habits: engineHabits };
}

async function loadRecords(from?: string, to?: string): Promise<Map<string, DayRecord>> {
  const days = await prisma.habitDay.findMany({
    where: from && to ? { date: { gte: from, lte: to } } : undefined,
    include: { entries: true },
  });
  const map = new Map<string, DayRecord>();
  for (const day of days) {
    const entries: Record<number, EntryStatus> = {};
    for (const e of day.entries) entries[e.habitId] = e.status as EntryStatus;
    map.set(day.date, { date: day.date, plan: day.plan, notes: day.notes, entries });
  }
  return map;
}

function scoreRange(from: string, to: string, records: Map<string, DayRecord>, ctx: EngineContext): DayScore[] {
  return dateRange(from, to).map((date) => scoreDay(date, records.get(date), ctx));
}

// ─── Days ───────────────────────────────────────────────────

export async function getDays(from: string, to: string) {
  if (toDayNumber(to) < toDayNumber(from)) throw new Error('"to" must not be before "from"');
  if (toDayNumber(to) - toDayNumber(from) + 1 > MAX_RANGE_DAYS) {
    throw new Error(`Date range is limited to ${MAX_RANGE_DAYS} days`);
  }
  const ctx = await loadContext();
  const records = await loadRecords(from, to);
  return scoreRange(from, to, records, ctx);
}

export async function getDay(date: string) {
  const [day] = await getDays(date, date);
  return day;
}

export async function saveDay(date: string, data: SaveDayInput) {
  await ensureDefaults();

  const dayUpdate: Record<string, unknown> = {};
  if (data.plan !== undefined) dayUpdate.plan = data.plan;
  if (data.notes !== undefined) dayUpdate.notes = data.notes;

  const day = await prisma.habitDay.upsert({
    where: { date },
    update: dayUpdate,
    create: { date, plan: data.plan ?? 'A', notes: data.notes ?? null },
  });

  if (data.entries) {
    const habitIds = new Set((await prisma.habit.findMany({ select: { id: true } })).map((h) => h.id));
    for (const [key, status] of Object.entries(data.entries)) {
      const habitId = parseInt(key, 10);
      if (!habitIds.has(habitId)) continue;
      if (status === null) {
        await prisma.habitEntry.deleteMany({ where: { dayId: day.id, habitId } });
      } else {
        await prisma.habitEntry.upsert({
          where: { dayId_habitId: { dayId: day.id, habitId } },
          update: { status },
          create: { dayId: day.id, habitId, status },
        });
      }
    }
  }

  return getDay(date);
}

// ─── Summary (streaks, chains, this week) ───────────────────

async function buildScores(ctx: EngineContext, today: string) {
  const records = await loadRecords();
  const loggedDates = Array.from(records.keys()).sort();
  const lastLogged = loggedDates.length > 0 ? loggedDates[loggedDates.length - 1] : today;
  const end = lastLogged > today ? lastLogged : today;
  const start = ctx.settings.startDate;

  const all = toDayNumber(end) >= toDayNumber(start) ? scoreRange(start, end, records, ctx) : [];
  const upToToday = all.filter((s) => s.date <= today);
  return { all, upToToday, records };
}

export async function getSummary() {
  const ctx = await loadContext();
  const today = todayString();
  const { all, upToToday, records } = await buildScores(ctx, today);

  const todayScore = scoreDay(today, records.get(today), ctx);
  const started = toDayNumber(today) >= toDayNumber(ctx.settings.startDate);

  const currentWeek = weekOf(today, ctx.settings.startDate);
  const weeks = [];
  for (let w = 1; w <= Math.max(currentWeek, 0); w++) weeks.push(weekStats(w, all, ctx));
  const thisWeek = weeks.length > 0 ? weeks[weeks.length - 1] : null;

  const habitsOut = ctx.habits.map((h) => ({
    habitId: h.id,
    name: h.name,
    group: h.group,
    activeToday: h.activeFromPhase <= todayScore.phase,
    ...habitStreak(h, upToToday, today),
    chain: habitChain(h, upToToday, today, CHAIN_LENGTH),
  }));

  return {
    started,
    today: todayScore,
    overall: {
      ...overallStreak(upToToday, today),
      chain: overallChain(upToToday, today, CHAIN_LENGTH),
    },
    weeklyGoalStreak: weeklyGoalStreak(weeks, currentWeek, ctx.settings.weeklyGoal),
    thisWeek: thisWeek
      ? {
          week: thisWeek.week,
          start: thisWeek.start,
          end: thisWeek.end,
          productive: thisWeek.productive,
          planCOk: thisWeek.planCOk,
          notYet: thisWeek.notYet,
          goal: ctx.settings.weeklyGoal,
          daysLeft: Math.max(0, toDayNumber(thisWeek.end) - toDayNumber(today)),
        }
      : null,
    habits: habitsOut,
    totals: {
      loggedDays: upToToday.filter((s) => s.logged).length,
      productiveDays: upToToday.filter((s) => s.result === 'PRODUCTIVE').length,
    },
  };
}

// ─── Weekly review ──────────────────────────────────────────

export async function getWeekly() {
  const ctx = await loadContext();
  const today = todayString();
  const { all } = await buildScores(ctx, today);

  const lastDate = all.length > 0 ? all[all.length - 1].date : today;
  const lastWeek = Math.max(1, weekOf(lastDate, ctx.settings.startDate));
  const weeks = [];
  for (let w = 1; w <= lastWeek; w++) weeks.push(weekStats(w, all, ctx));

  return {
    goal: ctx.settings.weeklyGoal,
    habits: ctx.habits.map((h) => ({ id: h.id, name: h.name, group: h.group, activeFromPhase: h.activeFromPhase })),
    weeks,
  };
}

// Used by export: every day of the plan year, scored.
export async function getPlanYear(days = 365) {
  const ctx = await loadContext();
  const start = ctx.settings.startDate;
  const records = await loadRecords();
  return { ctx, scores: scoreRange(start, addDays(start, days - 1), records, ctx) };
}

// ─── Single-habit dashboard ─────────────────────────────────

export async function getHabitStats(id: number) {
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) throw new Error('Habit not found');

  const ctx = await loadContext();
  const today = todayString();
  const { upToToday } = await buildScores(ctx, today);

  // Archived habits are not in the scoring context but can still be viewed.
  const engineHabit: EngineHabit = { id: habit.id, name: habit.name, group: habit.group, activeFromPhase: habit.activeFromPhase };
  const streak = habitStreak(engineHabit, upToToday, today);

  const rows = await prisma.habitEntry.findMany({
    where: { habitId: id },
    include: { day: { select: { date: true } } },
  });
  const entries: Record<string, EntryStatus> = {};
  for (const r of rows) entries[r.day.date] = r.status as EntryStatus;

  return {
    habit: {
      id: habit.id,
      name: habit.name,
      group: habit.group,
      activeFromPhase: habit.activeFromPhase,
      archived: habit.archived,
    },
    startDate: ctx.settings.startDate,
    today,
    ...streak,
    entries,
  };
}
