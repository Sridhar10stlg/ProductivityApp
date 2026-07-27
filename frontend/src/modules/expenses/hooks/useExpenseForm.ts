import { useState, useCallback } from 'react';
import { transactionFormSchema, TransactionFormData } from '../types/expense.types';
import dayjs from 'dayjs';

interface UseTransactionFormOptions {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void;
}

export function useTransactionForm({ initialData, onSubmit }: UseTransactionFormOptions) {
  const [formData, setFormData] = useState<Partial<TransactionFormData>>({
    type: initialData?.type ?? 'EXPENSE',
    amount: initialData?.amount ?? ('' as unknown as number),
    description: initialData?.description ?? '',
    date: initialData?.date ?? dayjs().format('YYYY-MM-DD'),
    categoryId: initialData?.categoryId ?? ('' as unknown as number),
    accountId: initialData?.accountId ?? ('' as unknown as number),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback((field: keyof TransactionFormData, value: string | number) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Reset category when type changes
      if (field === 'type') {
        next.categoryId = '' as unknown as number;
      }
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = useCallback((): TransactionFormData | null => {
    const result = transactionFormSchema.safeParse({
      ...formData,
      amount: typeof formData.amount === 'string' ? parseFloat(formData.amount) : formData.amount,
      categoryId:
        typeof formData.categoryId === 'string'
          ? parseInt(formData.categoryId, 10)
          : formData.categoryId,
      accountId:
        typeof formData.accountId === 'string'
          ? parseInt(formData.accountId, 10)
          : formData.accountId,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }

    setErrors({});
    return result.data;
  }, [formData]);

  const handleSubmit = useCallback(() => {
    const validated = validate();
    if (validated) {
      onSubmit(validated);
    }
  }, [validate, onSubmit]);

  const reset = useCallback((data?: Partial<TransactionFormData>) => {
    setFormData({
      type: data?.type ?? 'EXPENSE',
      amount: data?.amount ?? ('' as unknown as number),
      description: data?.description ?? '',
      date: data?.date ?? dayjs().format('YYYY-MM-DD'),
      categoryId: data?.categoryId ?? ('' as unknown as number),
      accountId: data?.accountId ?? ('' as unknown as number),
    });
    setErrors({});
  }, []);

  return { formData, errors, handleChange, handleSubmit, reset };
}
