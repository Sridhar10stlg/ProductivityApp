import { z } from 'zod';

export type TransactionType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  type: TransactionType;
}

export interface Account {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  categoryId: number;
  category: Category;
  accountId: number;
  account: Account;
  createdAt: string;
  updatedAt: string;
}

export interface DailyTotal {
  date: string;
  expense: number;
  income: number;
  net: number;
}

export interface MonthlySummary {
  totalExpense: number;
  totalIncome: number;
  net: number;
  categoryBreakdown: CategoryBreakdownItem[];
}

export interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  total: number;
  color: string;
  type: string;
  percentage?: number;
}

export interface YearlySummary {
  totalExpense: number;
  totalIncome: number;
  net: number;
  months: { month: number; expense: number; income: number; net: number }[];
}

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface Budget {
  id: number;
  categoryId: number;
  category: Category;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
}

export interface BudgetSummaryItem {
  id: number;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string | null;
  budgetAmount: number;
  period: BudgetPeriod;
  startDate: string;
  spent: number;
  remaining: number;
  percentage: number;
  periodStart: string;
  periodEnd: string;
}

export interface BudgetFormData {
  categoryId: number;
  amount: number;
  period: BudgetPeriod;
  startDate: string;
}

export const transactionFormSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive('Amount must be greater than 0'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  categoryId: z.number().positive('Category is required'),
  accountId: z.number().positive('Account is required'),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;
