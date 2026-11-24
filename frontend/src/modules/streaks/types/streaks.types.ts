export type HabitGroup = 'ANCHOR' | 'BODY' | 'BRAIN';
export type EntryStatus = 'DONE' | 'NA';
export type DayResult = 'PRODUCTIVE' | 'WELL_SPENT' | 'PLAN_C_OK' | 'NOT_YET';
export type PlanType = 'A' | 'B' | 'C';

export interface HabitSettings {
  id: number;
  startDate: string;
  productiveThreshold: number;
  planCThreshold: number;
  weeklyGoal: number;
  bodyNeeded: number; // Body habits to do for a productive day
  brainNeeded: number; // Brain habits to do for a productive day
  gateEasy: number;
  gateTotal: number;
  gateMedium: number;
}

export interface HabitPhase {
  id?: number;
  phase: number;
  startsInWeek: number;
  brainNeeded: number;
  description: string | null;
}

export interface Habit {
  id: number;
  name: string;
  group: HabitGroup;
  startDate: string | null; // counts toward the daily total from this date; null = from the beginning
  weekdays: number[] | null; // 0 = Sunday .. 6 = Saturday; null = every day
  weeklyTarget: number | null; // "N days a week" (any days); replaces weekdays
  sortOrder: number;
  archived: boolean;
}

export interface StreaksConfig {
  settings: HabitSettings;
  phases: HabitPhase[];
  habits: Habit[];
}

export interface DayScore {
  date: string;
  weekday: string;
  week: number;
  phase: number;
  plan: PlanType;
  notes: string | null;
  wellSpent: boolean;
  entries: Record<number, EntryStatus>;
  logged: boolean;
  applicable: number;
  done: number;
  anchorDone: number;
  anchorNeeded: number;
  anchorTotal: number;
  bodyDone: number;
  bodyNeeded: number;
  brainDone: number;
  brainNeeded: number;
  score: number | null;
  result: DayResult | null;
  inPlay: number[]; // habit ids that are part of this day's total
  weeklyDone: Record<number, number>; // weekly-target habits: times done so far this week
}

export interface SaveDayData {
  plan?: PlanType;
  notes?: string | null;
  wellSpent?: boolean;
  entries?: Record<number, EntryStatus | null>;
}

export type ChainState = DayResult | 'MISSED' | 'OPEN';
export type HabitChainState = EntryStatus | 'MISSED' | 'OPEN' | 'INACTIVE';

export interface StreakCounts {
  current: number;
  best: number;
}

export interface StreaksSummary {
  started: boolean;
  today: DayScore;
  overall: StreakCounts & { chain: { date: string; state: ChainState }[] };
  weeklyGoalStreak: StreakCounts;
  thisWeek: {
    week: number;
    start: string;
    end: string;
    productive: number;
    planCOk: number;
    notYet: number;
    goal: number;
    daysLeft: number;
  } | null;
  habits: (StreakCounts & {
    habitId: number;
    name: string;
    group: HabitGroup;
    activeToday: boolean;
    weeklyTarget: number | null;
    chain: { date: string; state: HabitChainState }[];
  })[];
  totals: { loggedDays: number; productiveDays: number };
}

export interface HabitStats {
  habit: { id: number; name: string; group: HabitGroup; startDate: string | null; weekdays: number[] | null; weeklyTarget: number | null; archived: boolean };
  startDate: string;
  today: string;
  current: number;
  best: number;
  entries: Record<string, EntryStatus>;
}

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

export interface WeeklyReview {
  goal: number;
  habits: { id: number; name: string; group: HabitGroup; startDate: string | null }[];
  weeks: WeekStats[];
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface LeetCodeEntry {
  id: number;
  date: string;
  problem: string;
  link: string | null;
  pattern: string | null;
  difficulty: Difficulty;
  minutes: number | null;
  solvedSolo: boolean;
  redoDone: boolean;
  notes: string | null;
  redoBy: string | null;
}

export interface LeetCodeData {
  entries: LeetCodeEntry[];
  stats: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    soloRate: number | null;
    redosDue: number;
    gates: Record<'easy' | 'total' | 'medium', { target: number; current: number }>;
  };
}

export type LeetCodeFormData = {
  date: string;
  problem: string;
  link?: string | null;
  pattern?: string | null;
  difficulty: Difficulty;
  minutes?: number | null;
  solvedSolo?: boolean;
  redoDone?: boolean;
  notes?: string | null;
};

export interface StreaksImportResult {
  settingsImported: boolean;
  phasesImported: number;
  habitsCreated: number;
  habitsUpdated: number;
  daysImported: number;
  entriesImported: number;
  leetCodeImported: number;
  leetCodeSkipped: number;
  warnings: string[];
}

export interface JsonPreviewHabit {
  index: number;
  name: string;
  emoji: string | null;
  frequency: string;
  frequencyCount: number;
  completions: number;
  first: string | null;
  last: string | null;
  suggestedHabitId: number | null;
}

export type JsonMappingItem =
  | { index: number; action: 'skip' }
  | { index: number; action: 'wellSpent' }
  | { index: number; action: 'map'; habitId: number }
  | { index: number; action: 'create'; group: HabitGroup; activeFromPhase: number };

export interface JsonImportResult {
  habitsCreated: number;
  habitsSkipped: number;
  daysMarkedWellSpent: number;
  daysCreated: number;
  entriesAdded: number;
  entriesAlreadyDone: number;
  warnings: string[];
}

export const GROUP_LABELS: Record<HabitGroup, string> = {
  ANCHOR: 'Anchor',
  BODY: 'Body',
  BRAIN: 'Brain',
};

export const GROUP_COLORS: Record<HabitGroup, string> = {
  ANCHOR: '#1976d2',
  BODY: '#2e7d32',
  BRAIN: '#7b1fa2',
};

export const PLAN_LABELS: Record<PlanType, string> = {
  A: 'A - Normal day',
  B: 'B - Late office',
  C: 'C - Sick / drained',
};

export const RESULT_LABELS: Record<DayResult, string> = {
  PRODUCTIVE: 'Productive Day',
  WELL_SPENT: 'Well spent',
  PLAN_C_OK: 'Plan C ok',
  NOT_YET: 'Not yet',
};

export const RESULT_COLORS: Record<DayResult, string> = {
  PRODUCTIVE: '#2e7d32',
  WELL_SPENT: '#00897b',
  PLAN_C_OK: '#0288d1',
  NOT_YET: '#ed6c02',
};
