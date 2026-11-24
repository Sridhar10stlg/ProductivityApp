import { randomUUID } from 'crypto';
import { z } from 'zod';
import prisma from '../../shared/db/prisma';
import { ensureDefaults, getConfig, getSummary, todayString } from './streaks.service';

// Import/export for the "completions per habit" JSON format used by other habit apps:
//   { settings: {...}, streaks: [{ name, emoji, color, frequency, completions: ["YYYY-MM-DD", ...], ... }] }

const YMD = /^\d{4}-\d{2}-\d{2}$/;

const fileSchema = z.object({
  streaks: z.array(
    z.object({
      name: z.string().min(1),
      emoji: z.string().optional(),
      frequency: z.string().optional(),
      frequencyCount: z.number().optional(),
      createdDate: z.string().optional(),
      completions: z.array(z.string()).default([]),
    })
  ),
});

export const mappingSchema = z.array(
  z.discriminatedUnion('action', [
    z.object({ index: z.number().int(), action: z.literal('skip') }),
    z.object({ index: z.number().int(), action: z.literal('map'), habitId: z.number().int() }),
    z.object({
      index: z.number().int(),
      action: z.literal('create'),
      group: z.enum(['ANCHOR', 'BODY', 'BRAIN']),
      activeFromPhase: z.number().int().min(1).default(1),
    }),
  ])
);
export type ImportMapping = z.infer<typeof mappingSchema>;

function parseFile(buffer: Buffer) {
  let raw: unknown;
  try {
    raw = JSON.parse(buffer.toString('utf-8').replace(/^﻿/, ''));
  } catch {
    throw new Error('This file is not valid JSON');
  }
  const parsed = fileSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error('Unrecognised format: expected a "streaks" list where each item has a name and completions');
  }
  return parsed.data.streaks.map((s) => {
    const dates = Array.from(new Set(s.completions.filter((d) => YMD.test(d)))).sort();
    return {
      name: s.name.trim(),
      emoji: s.emoji ?? null,
      frequency: s.frequency ?? 'DAILY',
      frequencyCount: s.frequencyCount ?? 1,
      dates,
      ignored: s.completions.length - dates.length,
    };
  });
}

// ─── Name matching (suggestions only; the user confirms them) ────────────

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'up', 'x', 'h', 'no', 'min']);

function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => t.slice(0, 5));
}

function similarity(a: string, b: string): number {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  ta.forEach((t) => tb.has(t) && shared++);
  return shared / (ta.size + tb.size - shared);
}

function suggest(name: string, habits: { id: number; name: string }[]): number | null {
  const exact = habits.find((h) => h.name.toLowerCase() === name.toLowerCase());
  if (exact) return exact.id;
  let best: { id: number; score: number } | null = null;
  for (const h of habits) {
    const score = similarity(name, h.name);
    if (score >= 0.33 && (!best || score > best.score)) best = { id: h.id, score };
  }
  return best ? best.id : null;
}

export async function previewJson(buffer: Buffer) {
  await ensureDefaults();
  const fileHabits = parseFile(buffer);
  const { habits } = await getConfig();
  return fileHabits.map((h, index) => ({
    index,
    name: h.name,
    emoji: h.emoji,
    frequency: h.frequency,
    frequencyCount: h.frequencyCount,
    completions: h.dates.length,
    first: h.dates[0] ?? null,
    last: h.dates[h.dates.length - 1] ?? null,
    suggestedHabitId: suggest(h.name, habits),
  }));
}

// ─── Import ──────────────────────────────────────────────────

export async function importJson(buffer: Buffer, mapping: ImportMapping) {
  await ensureDefaults();
  const fileHabits = parseFile(buffer);
  const warnings: string[] = [];
  const result = {
    habitsCreated: 0,
    habitsSkipped: 0,
    daysCreated: 0,
    entriesAdded: 0,
    entriesAlreadyDone: 0,
    warnings,
  };

  await prisma.$transaction(
    async (tx) => {
      // 1. Resolve every file habit to a database habit id (creating new ones when asked)
      const dates = new Map<number, Set<string>>(); // habitId -> dates
      const existing = await tx.habit.findMany({ select: { id: true, name: true } });
      const validIds = new Set(existing.map((h) => h.id));
      const idByName = new Map(existing.map((h) => [h.name.toLowerCase(), h.id]));
      const maxSort = await tx.habit.aggregate({ _max: { sortOrder: true } });
      let nextSort = (maxSort._max.sortOrder ?? 0) + 1;

      for (const m of mapping) {
        const fh = fileHabits[m.index];
        if (!fh) continue;
        if (m.action === 'skip') {
          result.habitsSkipped++;
          continue;
        }
        let habitId: number;
        if (m.action === 'map') {
          if (!validIds.has(m.habitId)) {
            warnings.push(`"${fh.name}" was mapped to a habit that no longer exists, skipped`);
            continue;
          }
          habitId = m.habitId;
        } else {
          // Re-importing the same file must not add the habit twice, so reuse one with the same name.
          const sameName = idByName.get(fh.name.toLowerCase());
          if (sameName !== undefined) {
            habitId = sameName;
          } else {
            const created = await tx.habit.create({
              data: { name: fh.name, group: m.group, activeFromPhase: m.activeFromPhase, sortOrder: nextSort++ },
            });
            validIds.add(created.id);
            idByName.set(fh.name.toLowerCase(), created.id);
            habitId = created.id;
            result.habitsCreated++;
          }
        }
        const set = dates.get(habitId) ?? new Set<string>();
        fh.dates.forEach((d) => set.add(d));
        dates.set(habitId, set);
        if (fh.ignored > 0) warnings.push(`"${fh.name}": ${fh.ignored} completion(s) had an unreadable date and were ignored`);
      }

      // 2. Make sure a day row exists for every date
      const allDates = new Set<string>();
      dates.forEach((set) => set.forEach((d) => allDates.add(d)));
      if (allDates.size === 0) return;

      const dateList = Array.from(allDates);
      const knownDays = await tx.habitDay.findMany({ where: { date: { in: dateList } }, select: { date: true } });
      const known = new Set(knownDays.map((d) => d.date));
      const missingDays = dateList.filter((d) => !known.has(d));
      if (missingDays.length > 0) {
        await tx.habitDay.createMany({ data: missingDays.map((date) => ({ date, plan: 'A' })) });
        result.daysCreated = missingDays.length;
      }
      const dayRows = await tx.habitDay.findMany({ where: { date: { in: dateList } }, select: { id: true, date: true } });
      const dayIdByDate = new Map(dayRows.map((d) => [d.date, d.id]));

      // 3. Add DONE entries (existing DONE stays, NA becomes DONE, nothing is removed)
      const habitIds = Array.from(dates.keys());
      const currentEntries = await tx.habitEntry.findMany({
        where: { habitId: { in: habitIds }, dayId: { in: Array.from(dayIdByDate.values()) } },
        select: { id: true, dayId: true, habitId: true, status: true },
      });
      const entryByKey = new Map(currentEntries.map((e) => [`${e.dayId}:${e.habitId}`, e]));

      const toCreate: { dayId: number; habitId: number; status: string }[] = [];
      const naToDone: number[] = [];
      dates.forEach((set, habitId) => {
        set.forEach((date) => {
          const dayId = dayIdByDate.get(date) as number;
          const current = entryByKey.get(`${dayId}:${habitId}`);
          if (!current) toCreate.push({ dayId, habitId, status: 'DONE' });
          else if (current.status === 'NA') naToDone.push(current.id);
          else result.entriesAlreadyDone++;
        });
      });
      if (toCreate.length > 0) await tx.habitEntry.createMany({ data: toCreate });
      if (naToDone.length > 0) await tx.habitEntry.updateMany({ where: { id: { in: naToDone } }, data: { status: 'DONE' } });
      result.entriesAdded = toCreate.length + naToDone.length;
    },
    { timeout: 120000, maxWait: 10000 }
  );

  return result;
}

// ─── Export ──────────────────────────────────────────────────

const GROUP_COLORS: Record<string, string> = { ANCHOR: '#A3D8FF', BODY: '#FFB726', BRAIN: '#C4A3FF' };

export async function exportJson() {
  await ensureDefaults();
  const { habits } = await getConfig();
  const summary = await getSummary();
  const streakOf = new Map(summary.habits.map((h) => [h.habitId, h]));

  const entries = await prisma.habitEntry.findMany({
    where: { status: 'DONE' },
    include: { day: { select: { date: true } } },
  });
  const datesByHabit = new Map<number, string[]>();
  for (const e of entries) {
    const list = datesByHabit.get(e.habitId) ?? [];
    list.push(e.day.date);
    datesByHabit.set(e.habitId, list);
  }

  const streaks = habits.map((h, i) => {
    const completions = (datesByHabit.get(h.id) ?? []).sort();
    const counts = streakOf.get(h.id);
    return {
      bestStreak: counts?.best ?? 0,
      color: GROUP_COLORS[h.group] ?? '#A3D8FF',
      completions,
      createdDate: completions[0] ?? todayString(),
      currentStreak: counts?.current ?? 0,
      emoji: '✅',
      frequency: 'DAILY',
      frequencyCount: 1,
      id: randomUUID(),
      lastCompletedDate: completions[completions.length - 1],
      name: h.name,
      position: i,
    };
  });

  return {
    settings: { theme: 'light', notifications_enabled: true, first_day_of_week: 7 },
    streaks,
  };
}
