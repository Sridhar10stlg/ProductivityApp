import { useEffect, useCallback, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  ListItemIcon,
  ListItemText,
  Autocomplete,
  Typography,
} from '@mui/material';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import AddIcon from '@mui/icons-material/Add';
import {
  useGetCategoriesQuery,
  useGetAccountsQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
} from '../store/expenseApi';
import { useTransactionForm } from '../hooks/useExpenseForm';
import { getIcon } from '../../../shared/components/IconPicker';
import { CategoryFormDialog } from './CategoryFormDialog';
import { AccountFormDialog } from './AccountFormDialog';
import type { Transaction, TransactionFormData, TransactionType } from '../types/expense.types';

interface TransactionFormDialogProps {
  open: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  defaultDate?: string;
  defaultType?: TransactionType;
}

export function ExpenseFormDialog({ open, onClose, transaction, defaultDate, defaultType }: TransactionFormDialogProps) {
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [accountFormOpen, setAccountFormOpen] = useState(false);

  const { data: allCategories = [] } = useGetCategoriesQuery();
  const { data: accounts = [] } = useGetAccountsQuery();
  const [createTransaction, { isLoading: isCreating }] = useCreateTransactionMutation();
  const [updateTransaction, { isLoading: isUpdating }] = useUpdateTransactionMutation();

  const isEditing = !!transaction;
  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = useCallback(
    async (data: TransactionFormData) => {
      if (isEditing && transaction) {
        await updateTransaction({ id: transaction.id, data });
      } else {
        await createTransaction(data);
      }
      onClose();
    },
    [isEditing, transaction, updateTransaction, createTransaction, onClose]
  );

  const { formData, errors, handleChange, handleSubmit: submitForm, reset } = useTransactionForm({
    initialData: transaction
      ? {
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description || '',
          date: transaction.date.split('T')[0],
          categoryId: transaction.categoryId,
          accountId: transaction.accountId,
        }
      : defaultDate
        ? { date: defaultDate, type: defaultType || 'EXPENSE' }
        : defaultType
          ? { type: defaultType }
          : undefined,
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (open) {
      reset(
        transaction
          ? {
              type: transaction.type,
              amount: transaction.amount,
              description: transaction.description || '',
              date: transaction.date.split('T')[0],
              categoryId: transaction.categoryId,
              accountId: transaction.accountId,
            }
          : {
              date: defaultDate,
              type: defaultType || 'EXPENSE',
              accountId: accounts.length === 1 ? accounts[0].id : undefined,
            }
      );
    }
  }, [open, transaction, defaultDate, defaultType, reset, accounts]);

  const currentType = (formData.type as TransactionType) || 'EXPENSE';
  const filteredCategories = allCategories.filter((c) => c.type === currentType);
  const isExpense = currentType === 'EXPENSE';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <ToggleButtonGroup
              value={currentType}
              exclusive
              onChange={(_, val) => val && handleChange('type', val)}
              fullWidth
              size="small"
            >
              <ToggleButton
                value="EXPENSE"
                sx={{
                  '&.Mui-selected': { bgcolor: '#fce4ec', color: '#d32f2f', '&:hover': { bgcolor: '#fce4ec' } },
                }}
              >
                <ArrowDownwardIcon sx={{ mr: 0.5, fontSize: 18 }} /> Expense
              </ToggleButton>
              <ToggleButton
                value="INCOME"
                sx={{
                  '&.Mui-selected': { bgcolor: '#e8f5e9', color: '#2e7d32', '&:hover': { bgcolor: '#e8f5e9' } },
                }}
              >
                <ArrowUpwardIcon sx={{ mr: 0.5, fontSize: 18 }} /> Income
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              label="Amount"
              type="number"
              value={formData.amount ?? ''}
              onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
              error={!!errors.amount}
              helperText={errors.amount}
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
            />

            <TextField
              label="Date"
              type="date"
              value={formData.date ?? ''}
              onChange={(e) => handleChange('date', e.target.value)}
              error={!!errors.date}
              helperText={errors.date}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              select
              label="Account"
              value={formData.accountId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'NEW') {
                  setAccountFormOpen(true);
                } else {
                  handleChange('accountId', parseInt(val, 10));
                }
              }}
              error={!!errors.accountId}
              helperText={errors.accountId}
              fullWidth
            >
              {accounts.map((acc) => (
                <MenuItem key={acc.id} value={acc.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getIcon(acc.icon)}
                    <span>{acc.name}</span>
                  </Box>
                </MenuItem>
              ))}
              <MenuItem value="NEW">
                <ListItemIcon sx={{ minWidth: 32 }}><AddIcon fontSize="small" /></ListItemIcon>
                <ListItemText>New Account...</ListItemText>
              </MenuItem>
            </TextField>

            <Autocomplete
              options={filteredCategories}
              getOptionLabel={(option) => option.name}
              value={filteredCategories.find((c) => c.id === formData.categoryId) || null}
              onChange={(_, newValue) => {
                if (newValue) handleChange('categoryId', newValue.id);
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getIcon(option.icon)}
                    <span>{option.name}</span>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  error={!!errors.categoryId}
                  helperText={errors.categoryId}
                />
              )}
              noOptionsText={
                <Typography variant="body2" color="text.secondary">No categories found</Typography>
              }
              fullWidth
            />
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setCategoryFormOpen(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              New Category
            </Button>

            <TextField
              label="Description (optional)"
              value={formData.description ?? ''}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={submitForm}
            variant="contained"
            disabled={isSubmitting}
            color={isExpense ? 'error' : 'success'}
          >
            {isEditing ? 'Update' : isExpense ? 'Add Expense' : 'Add Income'}
          </Button>
        </DialogActions>
      </Dialog>

      <CategoryFormDialog
        open={categoryFormOpen}
        onClose={() => setCategoryFormOpen(false)}
        type={currentType}
      />
      <AccountFormDialog
        open={accountFormOpen}
        onClose={() => setAccountFormOpen(false)}
      />
    </>
  );
}
