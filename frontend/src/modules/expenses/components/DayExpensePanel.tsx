import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import { useGetTransactionsQuery } from '../store/expenseApi';
import { ExpenseList } from './ExpenseList';
import { ExpenseFormDialog } from './ExpenseFormDialog';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';
import type { Transaction } from '../types/expense.types';

interface DayExpensePanelProps {
  date: string;
}

export function DayExpensePanel({ date }: DayExpensePanelProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const dateObj = dayjs(date);
  const { data: transactions = [], isLoading } = useGetTransactionsQuery({
    year: dateObj.year(),
    month: dateObj.month() + 1,
  });

  const dayTransactions = transactions.filter(
    (t) => dayjs(t.date).format('YYYY-MM-DD') === date
  );

  const dayExpense = dayTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const dayIncome = dayTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const dayNet = dayIncome - dayExpense;

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingTransaction(null);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {dateObj.format('dddd, MMMM D')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="error.main" fontWeight={500}>
              Expense: ₹{dayExpense.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight={500}>
              Income: ₹{dayIncome.toFixed(2)}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={600}
              color={dayNet >= 0 ? 'success.main' : 'error.main'}
            >
              Net: {dayNet >= 0 ? '+' : ''}₹{dayNet.toFixed(2)}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingTransaction(null);
            setFormOpen(true);
          }}
        >
          Add
        </Button>
      </Box>

      {isLoading ? (
        <LoadingSpinner />
      ) : dayTransactions.length === 0 ? (
        <EmptyState message="No transactions for this day" />
      ) : (
        <ExpenseList transactions={dayTransactions} onEdit={handleEdit} showDate={false} />
      )}

      <ExpenseFormDialog
        open={formOpen}
        onClose={handleClose}
        transaction={editingTransaction}
        defaultDate={date}
      />
    </Paper>
  );
}
