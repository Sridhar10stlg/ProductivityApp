import { z } from 'zod';

export const createTransactionSchema = z.object({
  type: z.enum(['EXPENSE', 'INCOME']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  categoryId: z.number().int().positive('Category is required'),
  accountId: z.number().int().positive('Account is required'),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  type: z.enum(['EXPENSE', 'INCOME']).optional(),
  categoryId: z.coerce.number().int().optional(),
  accountId: z.coerce.number().int().optional(),
  accountIds: z.string().optional(), // comma-separated IDs e.g. "1,2,3"
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
