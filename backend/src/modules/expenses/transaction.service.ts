import prisma from '../../shared/db/prisma';
import dayjs from 'dayjs';
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from './transaction.types';
import { getMonthRange, getYearRange } from '../../shared/utils/dateUtils';

function parseAccountIds(accountId?: number, accountIds?: string): number[] | undefined {
  if (accountIds) {
    const ids = accountIds.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    return ids.length > 0 ? ids : undefined;
  }
  if (accountId) return [accountId];
  return undefined;
}

function applyAccountFilter(where: Record<string, unknown>, accountId?: number, accountIds?: string) {
  const ids = parseAccountIds(accountId, accountIds);
  if (ids && ids.length === 1) {
    where.accountId = ids[0];
  } else if (ids && ids.length > 1) {
    where.accountId = { in: ids };
  }
}

export async function getAllTransactions(query: TransactionQuery) {
  const where: Record<string, unknown> = {};

  if (query.year && query.month) {
    const { start, end } = getMonthRange(query.year, query.month);
    where.date = { gte: start, lte: end };
  } else if (query.year) {
    const { start, end } = getYearRange(query.year);
    where.date = { gte: start, lte: end };
  } else if (query.startDate || query.endDate) {
    where.date = {
      ...(query.startDate && { gte: new Date(query.startDate) }),
      ...(query.endDate && { lte: new Date(query.endDate) }),
    };
  }

  if (query.type) where.type = query.type;
  if (query.categoryId) where.categoryId = query.categoryId;
  applyAccountFilter(where, query.accountId, query.accountIds);

  return prisma.transaction.findMany({
    where,
    include: { category: true, account: true },
    orderBy: { date: 'desc' },
  });
}

export async function getTransactionById(id: number) {
  return prisma.transaction.findUnique({
    where: { id },
    include: { category: true, account: true },
  });
}

export async function createTransaction(data: CreateTransactionInput) {
  return prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
      categoryId: data.categoryId,
      accountId: data.accountId,
    },
    include: { category: true, account: true },
  });
}

export async function updateTransaction(id: number, data: UpdateTransactionInput) {
  const updateData: Record<string, unknown> = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.accountId !== undefined) updateData.accountId = data.accountId;

  return prisma.transaction.update({
    where: { id },
    data: updateData,
    include: { category: true, account: true },
  });
}

export async function deleteTransaction(id: number) {
  return prisma.transaction.delete({ where: { id } });
}

export async function getDailyTotals(year: number, month: number, accountId?: number, accountIds?: string) {
  const { start, end } = getMonthRange(year, month);
  const where: Record<string, unknown> = { date: { gte: start, lte: end } };
  applyAccountFilter(where, accountId, accountIds);

  const transactions = await prisma.transaction.findMany({
    where,
    select: { date: true, amount: true, type: true },
  });

  const dailyMap = new Map<string, { expense: number; income: number }>();
  for (const t of transactions) {
    const key = dayjs(t.date).format('YYYY-MM-DD');
    const existing = dailyMap.get(key) || { expense: 0, income: 0 };
    if (t.type === 'EXPENSE') {
      existing.expense += t.amount;
    } else {
      existing.income += t.amount;
    }
    dailyMap.set(key, existing);
  }

  return Array.from(dailyMap, ([date, totals]) => ({
    date,
    expense: totals.expense,
    income: totals.income,
    net: totals.income - totals.expense,
  }));
}

export async function getMonthlySummary(year: number, month: number, accountId?: number, accountIds?: string) {
  const { start, end } = getMonthRange(year, month);
  const where: Record<string, unknown> = { date: { gte: start, lte: end } };
  applyAccountFilter(where, accountId, accountIds);

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
  });

  let totalExpense = 0;
  let totalIncome = 0;

  const categoryMap = new Map<number, { categoryId: number; categoryName: string; total: number; color: string; type: string }>();
  for (const t of transactions) {
    if (t.type === 'EXPENSE') {
      totalExpense += t.amount;
    } else {
      totalIncome += t.amount;
    }

    const existing = categoryMap.get(t.categoryId);
    if (existing) {
      existing.total += t.amount;
    } else {
      categoryMap.set(t.categoryId, {
        categoryId: t.categoryId,
        categoryName: t.category.name,
        total: t.amount,
        color: t.category.color || '#607d8b',
        type: t.type,
      });
    }
  }

  return {
    totalExpense,
    totalIncome,
    net: totalIncome - totalExpense,
    categoryBreakdown: Array.from(categoryMap.values()),
  };
}

export async function getYearlySummary(year: number, accountId?: number, accountIds?: string) {
  const { start, end } = getYearRange(year);
  const where: Record<string, unknown> = { date: { gte: start, lte: end } };
  applyAccountFilter(where, accountId, accountIds);

  const transactions = await prisma.transaction.findMany({
    where,
    select: { date: true, amount: true, type: true },
  });

  const monthlyMap = new Map<number, { expense: number; income: number }>();
  for (let m = 1; m <= 12; m++) {
    monthlyMap.set(m, { expense: 0, income: 0 });
  }

  let totalExpense = 0;
  let totalIncome = 0;

  for (const t of transactions) {
    const month = dayjs(t.date).month() + 1;
    const existing = monthlyMap.get(month)!;
    if (t.type === 'EXPENSE') {
      existing.expense += t.amount;
      totalExpense += t.amount;
    } else {
      existing.income += t.amount;
      totalIncome += t.amount;
    }
  }

  const months = Array.from(monthlyMap, ([month, totals]) => ({
    month,
    expense: totals.expense,
    income: totals.income,
    net: totals.income - totals.expense,
  }));

  return { totalExpense, totalIncome, net: totalIncome - totalExpense, months };
}

export async function getCategorySummary(year: number, month?: number, type?: string, accountId?: number, accountIds?: string) {
  let start: Date;
  let end: Date;

  if (month) {
    const range = getMonthRange(year, month);
    start = range.start;
    end = range.end;
  } else {
    const range = getYearRange(year);
    start = range.start;
    end = range.end;
  }

  const where: Record<string, unknown> = { date: { gte: start, lte: end } };
  if (type) where.type = type;
  applyAccountFilter(where, accountId, accountIds);

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
  });

  const grandTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<number, { categoryId: number; categoryName: string; total: number; color: string; type: string; percentage: number }>();
  for (const t of transactions) {
    const existing = categoryMap.get(t.categoryId);
    if (existing) {
      existing.total += t.amount;
    } else {
      categoryMap.set(t.categoryId, {
        categoryId: t.categoryId,
        categoryName: t.category.name,
        total: t.amount,
        color: t.category.color || '#607d8b',
        type: t.type,
        percentage: 0,
      });
    }
  }

  const result = Array.from(categoryMap.values()).map((c) => ({
    ...c,
    percentage: grandTotal > 0 ? Math.round((c.total / grandTotal) * 100) : 0,
  }));

  return result.sort((a, b) => b.total - a.total);
}
