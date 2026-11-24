import { Request, Response } from 'express';
import * as budgetService from './budget.service';

export async function list(_req: Request, res: Response) {
  const budgets = await budgetService.getAllBudgets();
  res.json({ success: true, data: budgets });
}

export async function create(req: Request, res: Response) {
  const { categoryId, amount, period, startDate } = req.body;
  if (!categoryId || !amount || !period || !startDate) {
    res.status(400).json({ success: false, error: 'categoryId, amount, period, and startDate are required' });
    return;
  }
  const budget = await budgetService.createBudget({ categoryId, amount, period, startDate });
  res.status(201).json({ success: true, data: budget });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const { categoryId, amount, period, startDate } = req.body;
  const budget = await budgetService.updateBudget(id, { categoryId, amount, period, startDate });
  res.json({ success: true, data: budget });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await budgetService.deleteBudget(id);
  res.json({ success: true, data: null });
}

export async function summary(req: Request, res: Response) {
  const accountIds = typeof req.query.accountIds === 'string' ? req.query.accountIds : undefined;
  const result = await budgetService.getBudgetSummary(accountIds);
  res.json({ success: true, data: result });
}
