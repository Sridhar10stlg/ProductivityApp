import prisma from '../../shared/db/prisma';
import { addDays } from './streaks.engine';
import { ensureDefaults, todayString } from './streaks.service';
import { CreateLeetCodeInput, UpdateLeetCodeInput } from './streaks.types';

// A problem not solved solo is due for a redo the next day.
function withRedoBy<T extends { date: string; solvedSolo: boolean }>(entry: T) {
  return { ...entry, redoBy: entry.solvedSolo ? null : addDays(entry.date, 1) };
}

export async function getLeetCode() {
  await ensureDefaults();
  const [entries, settings] = await Promise.all([
    prisma.leetCodeEntry.findMany({ orderBy: [{ date: 'desc' }, { id: 'desc' }] }),
    prisma.habitSettings.findUniqueOrThrow({ where: { id: 1 } }),
  ]);

  const today = todayString();
  const rows = entries.map(withRedoBy);
  const easy = rows.filter((r) => r.difficulty === 'EASY').length;
  const medium = rows.filter((r) => r.difficulty === 'MEDIUM').length;
  const hard = rows.filter((r) => r.difficulty === 'HARD').length;
  const solo = rows.filter((r) => r.solvedSolo).length;

  return {
    entries: rows,
    stats: {
      total: rows.length,
      easy,
      medium,
      hard,
      soloRate: rows.length > 0 ? solo / rows.length : null,
      redosDue: rows.filter((r) => r.redoBy && !r.redoDone && r.redoBy <= today).length,
      gates: {
        easy: { target: settings.gateEasy, current: easy },
        total: { target: settings.gateTotal, current: rows.length },
        medium: { target: settings.gateMedium, current: medium },
      },
    },
  };
}

export async function createLeetCode(data: CreateLeetCodeInput) {
  const entry = await prisma.leetCodeEntry.create({
    data: {
      date: data.date,
      problem: data.problem,
      link: data.link ?? null,
      pattern: data.pattern ?? null,
      difficulty: data.difficulty,
      minutes: data.minutes ?? null,
      solvedSolo: data.solvedSolo ?? true,
      redoDone: data.redoDone ?? false,
      notes: data.notes ?? null,
    },
  });
  return withRedoBy(entry);
}

export async function updateLeetCode(id: number, data: UpdateLeetCodeInput) {
  const updateData: Record<string, unknown> = {};
  if (data.date !== undefined) updateData.date = data.date;
  if (data.problem !== undefined) updateData.problem = data.problem;
  if (data.link !== undefined) updateData.link = data.link;
  if (data.pattern !== undefined) updateData.pattern = data.pattern;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
  if (data.minutes !== undefined) updateData.minutes = data.minutes;
  if (data.solvedSolo !== undefined) updateData.solvedSolo = data.solvedSolo;
  if (data.redoDone !== undefined) updateData.redoDone = data.redoDone;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const entry = await prisma.leetCodeEntry.update({ where: { id }, data: updateData });
  return withRedoBy(entry);
}

export async function deleteLeetCode(id: number) {
  return prisma.leetCodeEntry.delete({ where: { id } });
}
