import { Request, Response } from 'express';
import * as transactionService from './transaction.service';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from './transaction.types';

export async function list(req: Request, res: Response) {
  const query = transactionQuerySchema.parse(req.query);
  const transactions = await transactionService.getAllTransactions(query);
  res.json({ success: true, data: transactions });
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const transaction = await transactionService.getTransactionById(id);
  if (!transaction) {
    res.status(404).json({ success: false, error: 'Transaction not found' });
    return;
  }
  res.json({ success: true, data: transaction });
}

export async function create(req: Request, res: Response) {
  const data = createTransactionSchema.parse(req.body);
  const transaction = await transactionService.createTransaction(data);
  res.status(201).json({ success: true, data: transaction });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = updateTransactionSchema.parse(req.body);
  const transaction = await transactionService.updateTransaction(id, data);
  res.json({ success: true, data: transaction });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await transactionService.deleteTransaction(id);
  res.json({ success: true, data: null });
}

export async function dailyTotals(req: Request, res: Response) {
  const year = parseInt(req.query.year as string, 10);
  const month = parseInt(req.query.month as string, 10);
  const accountId = req.query.accountId ? parseInt(req.query.accountId as string, 10) : undefined;
  const accountIds = req.query.accountIds as string | undefined;
  if (isNaN(year) || isNaN(month)) {
    res.status(400).json({ success: false, error: 'year and month are required' });
    return;
  }
  const data = await transactionService.getDailyTotals(year, month, accountId, accountIds);
  res.json({ success: true, data });
}

export async function monthlySummary(req: Request, res: Response) {
  const year = parseInt(req.query.year as string, 10);
  const month = parseInt(req.query.month as string, 10);
  const accountId = req.query.accountId ? parseInt(req.query.accountId as string, 10) : undefined;
  const accountIds = req.query.accountIds as string | undefined;
  if (isNaN(year) || isNaN(month)) {
    res.status(400).json({ success: false, error: 'year and month are required' });
    return;
  }
  const data = await transactionService.getMonthlySummary(year, month, accountId, accountIds);
  res.json({ success: true, data });
}

export async function yearlySummary(req: Request, res: Response) {
  const year = parseInt(req.query.year as string, 10);
  const accountId = req.query.accountId ? parseInt(req.query.accountId as string, 10) : undefined;
  const accountIds = req.query.accountIds as string | undefined;
  if (isNaN(year)) {
    res.status(400).json({ success: false, error: 'year is required' });
    return;
  }
  const data = await transactionService.getYearlySummary(year, accountId, accountIds);
  res.json({ success: true, data });
}

export async function categorySummary(req: Request, res: Response) {
  const year = parseInt(req.query.year as string, 10);
  const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
  const type = req.query.type as string | undefined;
  const accountId = req.query.accountId ? parseInt(req.query.accountId as string, 10) : undefined;
  const accountIds = req.query.accountIds as string | undefined;
  if (isNaN(year)) {
    res.status(400).json({ success: false, error: 'year is required' });
    return;
  }
  const data = await transactionService.getCategorySummary(year, month, type, accountId, accountIds);
  res.json({ success: true, data });
}
