import { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import dayjs from 'dayjs';
import { useDeleteTransactionMutation } from '../store/expenseApi';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import type { Transaction } from '../types/expense.types';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  showDate?: boolean;
}

export function ExpenseList({ transactions, onEdit, showDate = true }: TransactionListProps) {
  const [deleteTransaction] = useDeleteTransactionMutation();
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteTransaction(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <List disablePadding>
        {transactions.map((tx) => {
          const isExpense = tx.type === 'EXPENSE';
          return (
            <ListItem
              key={tx.id}
              sx={{
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 1.5,
              }}
              secondaryAction={
                <Box>
                  <IconButton size="small" onClick={() => onEdit(tx)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => setDeleteTarget(tx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isExpense ? (
                      <ArrowDownwardIcon sx={{ fontSize: 16, color: '#d32f2f' }} />
                    ) : (
                      <ArrowUpwardIcon sx={{ fontSize: 16, color: '#2e7d32' }} />
                    )}
                    <Typography
                      variant="body1"
                      fontWeight={600}
                      color={isExpense ? 'error.main' : 'success.main'}
                    >
                      {isExpense ? '-' : '+'}₹{tx.amount.toFixed(2)}
                    </Typography>
                    <Chip
                      label={tx.category.name}
                      size="small"
                      sx={{
                        bgcolor: tx.category.color || '#607d8b',
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                    <Chip
                      label={tx.account.name}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {tx.description || 'No description'}
                    {showDate && <> &middot; {dayjs(tx.date).format('MMM D, YYYY')}</>}
                  </Typography>
                }
              />
            </ListItem>
          );
        })}
      </List>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ₹${deleteTarget?.amount.toFixed(2)} ${deleteTarget?.type.toLowerCase()}?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
