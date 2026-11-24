import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import prisma from '../../shared/db/prisma';
import { toDayNumber, fromDayNumber } from './streaks.engine';
import { ensureDefaults, getConfig, getPlanYear, getWeekly } from './streaks.service';

dayjs.extend(customParseFormat);

const TEXT_DATE_FORMATS = ['DD-MMM-YY', 'DD-MMM-YYYY', 'DD/MMM/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];
const GROUPS = ['ANCHOR', 'BODY', 'BRAIN'];
// Columns in the Tracker sheet that are not habits.
const TRACKER_META = ['date', 'day', 'week', 'phase', 'plan', 'applicable', 'done', 'needed', 'brain done',
  'brain needed', 'score', 'result', 'notes'];

type Row = unknown[];

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

function readRows(workbook: XLSX.WorkBook, sheetName: string): Row[] {
  return XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { header: 1, raw: true, defval: null });
}

function findSheet(workbook: XLSX.WorkBook, pattern: RegExp): string | undefined {
  return workbook.SheetNames.find((n) => pattern.test(n));
}

// Excel stores dates as serial numbers; text dates are tried against common formats.
function cellToYmd(v: unknown): string | null {
  if (typeof v === 'number' && v > 20000) {
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof v === 'string' && v.trim()) {
    const parsed = dayjs(v.trim(), TEXT_DATE_FORMATS, true);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null;
  }
  return null;
}

function toShare(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v));
  if (Number.isNaN(n)) return null;
  return n > 1 ? n / 100 : n;
}

function toInt(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isNaN(n) ? null : n;
}

function toGroup(v: unknown): string {
  const g = String(v ?? '').trim().toUpperCase();
  return GROUPS.includes(g) ? g : 'ANCHOR';
}

interface ParsedHabit {
  name: string;
  group: string;
  activeFromPhase: number;
}

interface ParsedSettings {
  startDate: string | null;
  productiveThreshold: number | null;
  planCThreshold: number | null;
  weeklyGoal: number | null;
  phases: { phase: number; startsInWeek: number; brainNeeded: number; description: string | null }[];
  habits: ParsedHabit[];
}

function parseSettingsSheet(rows: Row[]): ParsedSettings {
  const out: ParsedSettings = {
    startDate: null,
    productiveThreshold: null,
    planCThreshold: null,
    weeklyGoal: null,
    phases: [],
    habits: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const label = norm(r[0]);

    if (label.startsWith('start date')) out.startDate = cellToYmd(r[1]);
    else if (label.includes('productive') && label.includes('threshold')) out.productiveThreshold = toShare(r[1]);
    else if (label.includes('plan c') && label.includes('threshold')) out.planCThreshold = toShare(r[1]);
    else if (label.includes('weekly goal')) out.weeklyGoal = toInt(r[1]);
    else if (label === 'phase' && norm(r[1]).startsWith('starts')) {
      for (let j = i + 1; j < rows.length; j++) {
        const p = toInt(rows[j][0]);
        const startsInWeek = toInt(rows[j][1]);
        if (p === null || startsInWeek === null || typeof rows[j][0] === 'string' && Number.isNaN(Number(rows[j][0]))) break;
        out.phases.push({
          phase: p,
          startsInWeek,
          brainNeeded: toInt(rows[j][2]) ?? 1,
          description: rows[j][3] ? String(rows[j][3]) : null,
        });
      }
    } else if (label === 'habit' && norm(r[1]) === 'group') {
      for (let j = i + 1; j < rows.length; j++) {
        const name = String(rows[j][0] ?? '').trim();
        if (!name) break;
        out.habits.push({ name, group: toGroup(rows[j][1]), activeFromPhase: toInt(rows[j][2]) ?? 1 });
      }
    }
  }
  return out;
}

interface ParsedDay {
  date: string;
  plan: string;
  notes: string | null;
  entries: { habitName: string; status: 'DONE' | 'NA' }[];
}

interface ParsedTracker {
  habits: ParsedHabit[];
  days: ParsedDay[];
}

function parseTrackerSheet(rows: Row[], fallbackStart: string | null): ParsedTracker | null {
  const headerIdx = rows.slice(0, 15).findIndex((r) => r.some((c) => norm(c) === 'date') && r.some((c) => norm(c) === 'plan'));
  if (headerIdx < 0) return null;

  const header = rows[headerIdx].map(norm);
  const dateCol = header.indexOf('date');
  const planCol = header.indexOf('plan');
  const notesCol = header.indexOf('notes');
  const firstHabit = Math.max(dateCol, planCol) + 1;
  const endHabit = header.indexOf('applicable') >= 0 ? header.indexOf('applicable') : header.length;

  const groupRow = rows.slice(0, headerIdx).find((r) => norm(r[0]) === 'group');
  const phaseRow = rows.slice(0, headerIdx).find((r) => norm(r[0]).startsWith('active from'));

  const habitCols: { col: number; habit: ParsedHabit }[] = [];
  for (let c = firstHabit; c < endHabit; c++) {
    const name = String(rows[headerIdx][c] ?? '').trim();
    if (!name || TRACKER_META.includes(norm(name))) continue;
    habitCols.push({
      col: c,
      habit: {
        name,
        group: toGroup(groupRow?.[c]),
        activeFromPhase: toInt(phaseRow?.[c]) ?? 1,
      },
    });
  }

  const days: ParsedDay[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const entries: ParsedDay['entries'] = [];
    for (const { col, habit } of habitCols) {
      const v = String(r[col] ?? '').trim().toLowerCase();
      if (v === 'x') entries.push({ habitName: habit.name, status: 'DONE' });
      else if (v === '-' || v === '–') entries.push({ habitName: habit.name, status: 'NA' });
    }

    const planRaw = String(r[planCol] ?? '').trim().toUpperCase();
    const plan = ['A', 'B', 'C'].includes(planRaw) ? planRaw : 'A';
    const notes = notesCol >= 0 && r[notesCol] ? String(r[notesCol]) : null;
    if (entries.length === 0 && plan === 'A' && !notes) continue;

    let date = cellToYmd(r[dateCol]);
    if (!date && fallbackStart) date = fromDayNumber(toDayNumber(fallbackStart) + (i - headerIdx - 1));
    if (!date) continue;

    days.push({ date, plan, notes, entries });
  }

  return { habits: habitCols.map((h) => h.habit), days };
}

interface ParsedLeetCode {
  date: string;
  problem: string;
  link: string | null;
  pattern: string | null;
  difficulty: string;
  minutes: number | null;
  solvedSolo: boolean;
  notes: string | null;
}

function parseLeetCodeSheet(rows: Row[]): { entries: ParsedLeetCode[]; skipped: number } {
  const headerIdx = rows.slice(0, 15).findIndex((r) => r.some((c) => norm(c) === 'date') && r.some((c) => norm(c) === 'problem'));
  if (headerIdx < 0) return { entries: [], skipped: 0 };

  const header = rows[headerIdx].map(norm);
  const col = (name: string) => header.findIndex((h) => h.startsWith(name));
  const cDate = col('date');
  const cProblem = col('problem');
  const cLink = col('link');
  const cPattern = col('pattern');
  const cDifficulty = col('difficulty');
  const cMinutes = col('minutes');
  const cSolo = col('solved');
  const cNotes = col('notes');

  const entries: ParsedLeetCode[] = [];
  let skipped = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const problem = String(r[cProblem] ?? '').trim();
    const date = cellToYmd(r[cDate]);
    if (!problem || !date) continue;

    const notes = cNotes >= 0 && r[cNotes] ? String(r[cNotes]) : null;
    if (notes && norm(notes).startsWith('example row')) {
      skipped++;
      continue;
    }

    const difficulty = String(r[cDifficulty] ?? '').trim().toUpperCase();
    entries.push({
      date,
      problem,
      link: cLink >= 0 && r[cLink] ? String(r[cLink]) : null,
      pattern: cPattern >= 0 && r[cPattern] ? String(r[cPattern]) : null,
      difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'EASY',
      minutes: cMinutes >= 0 ? toInt(r[cMinutes]) : null,
      solvedSolo: cSolo >= 0 ? norm(r[cSolo]) !== 'no' : true,
      notes,
    });
  }
  return { entries, skipped };
}

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

export async function importFromExcel(buffer: Buffer, options: { overwriteSettings: boolean }) {
  await ensureDefaults();
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const settingsSheet = findSheet(workbook, /^settings/i);
  const trackerSheet = findSheet(workbook, /tracker/i) ?? workbook.SheetNames[0];
  const leetCodeSheet = findSheet(workbook, /leetcode/i);

  const parsedSettings = settingsSheet ? parseSettingsSheet(readRows(workbook, settingsSheet)) : null;
  const tracker = trackerSheet ? parseTrackerSheet(readRows(workbook, trackerSheet), parsedSettings?.startDate ?? null) : null;
  const leetCode = leetCodeSheet ? parseLeetCodeSheet(readRows(workbook, leetCodeSheet)) : { entries: [], skipped: 0 };

  if (!tracker && !parsedSettings && leetCode.entries.length === 0) {
    throw new Error('Could not find a Tracker sheet (Date and Plan columns), Settings sheet or LeetCode log in this file');
  }

  const result: StreaksImportResult = {
    settingsImported: false,
    phasesImported: 0,
    habitsCreated: 0,
    habitsUpdated: 0,
    daysImported: 0,
    entriesImported: 0,
    leetCodeImported: 0,
    leetCodeSkipped: leetCode.skipped,
    warnings: [],
  };

  await prisma.$transaction(
    async (tx) => {
      // 1. Settings and phases
      if (parsedSettings && options.overwriteSettings) {
        const data: Record<string, unknown> = {};
        if (parsedSettings.startDate) data.startDate = parsedSettings.startDate;
        if (parsedSettings.productiveThreshold !== null) data.productiveThreshold = parsedSettings.productiveThreshold;
        if (parsedSettings.planCThreshold !== null) data.planCThreshold = parsedSettings.planCThreshold;
        if (parsedSettings.weeklyGoal !== null) data.weeklyGoal = parsedSettings.weeklyGoal;
        if (Object.keys(data).length > 0) {
          await tx.habitSettings.update({ where: { id: 1 }, data });
          result.settingsImported = true;
        }
        if (parsedSettings.phases.length > 0) {
          await tx.habitPhase.deleteMany();
          await tx.habitPhase.createMany({ data: parsedSettings.phases });
          result.phasesImported = parsedSettings.phases.length;
        }
      }

      // 2. Habits: file list wins when present, otherwise the Tracker header
      const fileHabits = parsedSettings && parsedSettings.habits.length > 0 ? parsedSettings.habits : tracker?.habits ?? [];
      const existing = await tx.habit.findMany();
      const byName = new Map(existing.map((h) => [h.name.toLowerCase(), h]));
      let nextOrder = existing.reduce((m, h) => Math.max(m, h.sortOrder), -1) + 1;

      for (let i = 0; i < fileHabits.length; i++) {
        const fh = fileHabits[i];
        const found = byName.get(fh.name.toLowerCase());
        if (found) {
          if (options.overwriteSettings) {
            const updated = await tx.habit.update({
              where: { id: found.id },
              data: { group: fh.group, activeFromPhase: fh.activeFromPhase, sortOrder: i, archived: false },
            });
            byName.set(fh.name.toLowerCase(), updated);
            result.habitsUpdated++;
          }
        } else {
          const created = await tx.habit.create({
            data: {
              name: fh.name,
              group: fh.group,
              activeFromPhase: fh.activeFromPhase,
              sortOrder: options.overwriteSettings ? i : nextOrder++,
            },
          });
          byName.set(fh.name.toLowerCase(), created);
          result.habitsCreated++;
        }
      }

      // 3. Daily entries
      if (tracker) {
        const missing = new Set<string>();
        for (const day of tracker.days) {
          const record = await tx.habitDay.upsert({
            where: { date: day.date },
            update: { plan: day.plan, notes: day.notes },
            create: { date: day.date, plan: day.plan, notes: day.notes },
          });

          const habitIds: number[] = [];
          const rows: { dayId: number; habitId: number; status: string }[] = [];
          for (const habit of tracker.habits) {
            const h = byName.get(habit.name.toLowerCase());
            if (!h) {
              missing.add(habit.name);
              continue;
            }
            habitIds.push(h.id);
          }
          for (const e of day.entries) {
            const h = byName.get(e.habitName.toLowerCase());
            if (h) rows.push({ dayId: record.id, habitId: h.id, status: e.status });
          }

          await tx.habitEntry.deleteMany({ where: { dayId: record.id, habitId: { in: habitIds } } });
          if (rows.length > 0) await tx.habitEntry.createMany({ data: rows });
          result.daysImported++;
          result.entriesImported += rows.length;
        }
        if (missing.size > 0) result.warnings.push(`Habits not found, skipped: ${Array.from(missing).join(', ')}`);
      }

      // 4. LeetCode log (skip rows already present with the same date + problem)
      if (leetCode.entries.length > 0) {
        const existingRows = await tx.leetCodeEntry.findMany({ select: { date: true, problem: true } });
        const seen = new Set(existingRows.map((r) => `${r.date}::${r.problem.toLowerCase()}`));
        for (const e of leetCode.entries) {
          const key = `${e.date}::${e.problem.toLowerCase()}`;
          if (seen.has(key)) {
            result.leetCodeSkipped++;
            continue;
          }
          await tx.leetCodeEntry.create({ data: e });
          seen.add(key);
          result.leetCodeImported++;
        }
      }
    },
    { timeout: 120000, maxWait: 10000 }
  );

  return result;
}

// ─── Export ─────────────────────────────────────────────────

const EXCEL_EPOCH_OFFSET = 25569;

const dateCell = (ymd: string): XLSX.CellObject => ({ t: 'n', v: toDayNumber(ymd) + EXCEL_EPOCH_OFFSET, z: 'dd-mmm-yy' });
const percentCell = (v: number | null): XLSX.CellObject | string =>
  v === null ? '' : { t: 'n', v, z: '0%' };

const RESULT_LABELS: Record<string, string> = {
  PRODUCTIVE: 'Productive',
  WELL_SPENT: 'Well spent',
  PLAN_C_OK: 'Plan C ok',
  NOT_YET: 'Not yet',
};

const capitalize = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export async function exportToExcel(): Promise<Buffer> {
  const { settings, phases, habits: allHabits } = await getConfig();
  const habits = allHabits.filter((h) => !h.archived);
  const { scores } = await getPlanYear(365);
  const weekly = await getWeekly();
  const leetCode = await prisma.leetCodeEntry.findMany({ orderBy: [{ date: 'asc' }, { id: 'asc' }] });

  const workbook = XLSX.utils.book_new();

  // Settings
  const settingsAoa: unknown[][] = [
    ['Settings and habit list'],
    ['Edit these in the app (Streaks > Settings). Re-importing this file restores them.'],
    ['Start date (day 1 of the plan)', dateCell(settings.startDate)],
    ['Productive-day threshold', percentCell(settings.productiveThreshold)],
    ['Plan C threshold', percentCell(settings.planCThreshold)],
    ['Weekly goal (productive days)', settings.weeklyGoal],
    [],
    ['Phase', 'Starts in week', 'Brain habits needed', 'What it adds'],
    ...phases.map((p) => [p.phase, p.startsInWeek, p.brainNeeded, p.description ?? '']),
    [],
    ['Habit', 'Group', 'Active from phase'],
    ...habits.map((h) => [h.name, capitalize(h.group), h.activeFromPhase]),
  ];
  const settingsSheet = XLSX.utils.aoa_to_sheet(settingsAoa);
  settingsSheet['!cols'] = [{ wch: 34 }, { wch: 16 }, { wch: 20 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(workbook, settingsSheet, 'Settings');

  // Tracker
  const lead = ['', '', '', '', ''];
  const trackerAoa: unknown[][] = [
    ['Daily habit tracker'],
    ['x = done   - = not applicable today   blank = missed.   Plan: A normal, B late office, C sick/drained.'],
    ['Group', '', '', '', '', ...habits.map((h) => capitalize(h.group))],
    ['Active from phase', ...lead.slice(1), ...habits.map((h) => h.activeFromPhase)],
    [
      'Date', 'Day', 'Week', 'Phase', 'Plan', ...habits.map((h) => h.name),
      'Applicable', 'Done', 'Needed', 'Brain done', 'Brain needed', 'Score', 'Result', 'Notes',
    ],
    ...scores.map((s) => [
      dateCell(s.date),
      s.weekday,
      s.week,
      s.phase,
      s.plan === 'A' ? '' : s.plan,
      ...habits.map((h) => (s.entries[h.id] === 'DONE' ? 'x' : s.entries[h.id] === 'NA' ? '-' : '')),
      s.applicable,
      s.done,
      s.anchorNeeded,
      s.brainDone,
      s.brainNeeded,
      percentCell(s.score),
      s.result ? RESULT_LABELS[s.result] : '',
      s.notes ?? '',
    ]),
  ];
  const trackerSheet = XLSX.utils.aoa_to_sheet(trackerAoa);
  trackerSheet['!cols'] = [{ wch: 11 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, ...habits.map(() => ({ wch: 13 }))];
  XLSX.utils.book_append_sheet(workbook, trackerSheet, 'Tracker');

  // Weekly (values only; the app recalculates this)
  const weeklyAoa: unknown[][] = [
    ['Weekly review'],
    [`Goal: ${weekly.goal} productive days. Habit columns show each habit's hit rate for the week.`],
    [],
    [
      'Week', 'Starts', 'Ends', 'Phase', 'Productive', 'Plan C ok', 'Not yet', 'Goal met', 'Avg score', 'Weakest habit',
      ...weekly.habits.map((h) => h.name),
    ],
    ...weekly.weeks.map((w) => [
      w.week,
      dateCell(w.start),
      dateCell(w.end),
      w.phase,
      w.productive,
      w.planCOk,
      w.notYet,
      w.goalMet === null ? '' : w.goalMet ? 'Yes' : 'No',
      percentCell(w.avgScore),
      w.weakestHabit ?? '',
      ...weekly.habits.map((h) => percentCell(w.habitRates[h.id] ?? null)),
    ]),
  ];
  const weeklySheet = XLSX.utils.aoa_to_sheet(weeklyAoa);
  weeklySheet['!cols'] = [{ wch: 7 }, { wch: 11 }, { wch: 11 }, { wch: 7 }, ...Array(6).fill({ wch: 12 }), { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, weeklySheet, 'Weekly');

  // LeetCode log
  const leetCodeAoa: unknown[][] = [
    ['Problem log (one line per problem, solved without AI)'],
    ['25 min solo, then 5 min with a hint. Solved solo = No puts a redo date on the next day.'],
    [],
    ['Date', 'Problem', 'Link', 'Pattern', 'Difficulty', 'Minutes', 'Solved solo?', 'Redo by', 'Notes'],
    ...leetCode.map((e) => [
      dateCell(e.date),
      e.problem,
      e.link ?? '',
      e.pattern ?? '',
      capitalize(e.difficulty),
      e.minutes ?? '',
      e.solvedSolo ? 'Yes' : 'No',
      e.solvedSolo ? '' : dateCell(fromDayNumber(toDayNumber(e.date) + 1)),
      e.notes ?? '',
    ]),
  ];
  const leetCodeSheet = XLSX.utils.aoa_to_sheet(leetCodeAoa);
  leetCodeSheet['!cols'] = [{ wch: 11 }, { wch: 30 }, { wch: 40 }, { wch: 16 }, { wch: 11 }, { wch: 9 }, { wch: 13 }, { wch: 11 }, { wch: 34 }];
  XLSX.utils.book_append_sheet(workbook, leetCodeSheet, 'LeetCode log');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
