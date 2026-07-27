import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Autocomplete,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useGetCategoriesQuery, useCreateBudgetMutation, useUpdateBudgetMutation } from '../store/expenseApi';
import { getIcon } from '../../../shared/components/IconPicker';
import type { Budget, BudgetPeriod } from '../types/expense.types';

interface BudgetFormDialogProps {
  open: boolean;
  onClose: () => void;
  budget?: Budget | null;
}

const PERIODS: { value: BudgetPeriod; label: string }[] = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export function BudgetFormDialog({ open, onClose, budget }: BudgetFormDialogProps) {
  const { data: allCategories = [] } = useGetCategoriesQuery({ type: 'EXPENSE' });
  const [createBudget, { isLoading: isCreating }] = useCreateBudgetMutation();
  const [updateBudget, { isLoading: isUpdating }] = useUpdateBudgetMutation();

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState<number | ''>('');
  const [period, setPeriod] = useState<BudgetPeriod>('MONTHLY');
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));

  const isEditing = !!budget;

  useEffect(() => {
    if (open) {
      if (budget) {
        setCategoryId(budget.categoryId);
        setAmount(budget.amount);
        setPeriod(budget.period);
        setStartDate(budget.startDate.split('T')[0]);
      } else {
        setCategoryId(null);
        setAmount('');
        setPeriod('MONTHLY');
        setStartDate(dayjs().format('YYYY-MM-DD'));
      }
    }
  }, [open, budget]);

  const handleSubmit = async () => {
    if (!categoryId || !amount || !startDate) return;

    const data = { categoryId, amount: Number(amount), period, startDate };

    if (isEditing && budget) {
      await updateBudget({ id: budget.id, data });
    } else {
      await createBudget(data);
    }
    onClose();
  };

  const selectedCategory = allCategories.find((c) => c.id === categoryId) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Autocomplete
            options={allCategories}
            getOptionLabel={(option) => option.name}
            value={selectedCategory}
            onChange={(_, newValue) => setCategoryId(newValue ? newValue.id : null)}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getIcon(option.icon)}
                  <span>{option.name}</span>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Category" required />
            )}
            noOptionsText={
              <Typography variant="body2" color="text.secondary">No expense categories found</Typography>
            }
            fullWidth
          />

          <TextField
            label="Budget Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
            inputProps={{ min: 0, step: 0.01 }}
            required
            fullWidth
          />

          <TextField
            select
            label="Repeat Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value as BudgetPeriod)}
            fullWidth
          >
            {PERIODS.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            required
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isCreating || isUpdating || !categoryId || !amount}
        >
          {isEditing ? 'Update' : 'Add Budget'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
