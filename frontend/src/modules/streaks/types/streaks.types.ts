export type HabitGroup = 'ANCHOR' | 'BODY' | 'BRAIN';
export type EntryStatus = 'DONE' | 'NA';
export type DayResult = 'PRODUCTIVE' | 'PLAN_C_OK' | 'NOT_YET';
export type PlanType = 'A' | 'B' | 'C';

export interface HabitSettings {
  id: number;
  startDate: string;
  productiveThreshold: number;
  planCThreshold: number;
  weeklyGoal: number;
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
  activeFromPhase: number;
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

export interface SaveDayData {
  plan?: PlanType;
  notes?: string | null;
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
    chain: { date: string; state: HabitChainState }[];
  })[];
  totals: { loggedDays: number; productiveDays: number };
}

export interface HabitStats {
  habit: { id: number; name: string; group: HabitGroup; activeFromPhase: number; archived: boolean };
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
  habits: { id: number; name: string; group: HabitGroup; activeFromPhase: number }[];
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
  PRODUCTIVE: 'Productive',
  PLAN_C_OK: 'Plan C ok',
  NOT_YET: 'Not yet',
};

export const RESULT_COLORS: Record<DayResult, string> = {
  PRODUCTIVE: '#2e7d32',
  PLAN_C_OK: '#0288d1',
  NOT_YET: '#ed6c02',
};
