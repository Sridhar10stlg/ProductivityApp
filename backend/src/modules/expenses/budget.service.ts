import prisma from '../../shared/db/prisma';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

export async function getAllBudgets() {
  return prisma.budget.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createBudget(data: {
  categoryId: number;
  amount: number;
  period: string;
  startDate: string;
}) {
  return prisma.budget.create({
    data: {
      categoryId: data.categoryId,
      amount: data.amount,
      period: data.period,
      startDate: new Date(data.startDate),
    },
    include: { category: true },
  });
}

export async function updateBudget(
  id: number,
  data: { categoryId?: number; amount?: number; period?: string; startDate?: string }
) {
  const updateData: Record<string, unknown> = {};
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.period !== undefined) updateData.period = data.period;
  if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);

  return prisma.budget.update({
    where: { id },
    data: updateData,
    include: { category: true },
  });
}

export async function deleteBudget(id: number) {
  return prisma.budget.delete({ where: { id } });
}

function getPeriodRange(period: string, referenceDate: dayjs.Dayjs) {
  switch (period) {
    case 'WEEKLY': {
      const start = referenceDate.startOf('isoWeek').toDate();
      const end = referenceDate.endOf('isoWeek').toDate();
      return { start, end };
    }
    case 'MONTHLY': {
      const start = referenceDate.startOf('month').toDate();
      const end = referenceDate.endOf('month').toDate();
      return { start, end };
    }
    case 'YEARLY': {
      const start = referenceDate.startOf('year').toDate();
      const end = referenceDate.endOf('year').toDate();
      return { start, end };
    }
    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

export async function getBudgetSummary() {
  const budgets = await prisma.budget.findMany({
    include: { category: true },
  });

  const now = dayjs();
  const results = [];

  for (const budget of budgets) {
    const { start, end } = getPeriodRange(budget.period, now);

    const spent = await prisma.transaction.aggregate({
      where: {
        categoryId: budget.categoryId,
        type: 'EXPENSE',
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    });

    const spentAmount = spent._sum.amount || 0;

    results.push({
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: budget.category.name,
      categoryColor: budget.category.color || '#607d8b',
      categoryIcon: budget.category.icon,
      budgetAmount: budget.amount,
      period: budget.period,
      startDate: budget.startDate.toISOString(),
      spent: spentAmount,
      remaining: budget.amount - spentAmount,
      percentage: budget.amount > 0 ? Math.round((spentAmount / budget.amount) * 100) : 0,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
    });
  }

  return results;
}
