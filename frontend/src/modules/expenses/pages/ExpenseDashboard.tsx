import { useState, useMemo } from 'react';
import { Box, Grid, Fab, ToggleButtonGroup, ToggleButton, MenuItem, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TodayIcon from '@mui/icons-material/Today';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ExpenseSummaryCard } from '../components/ExpenseSummaryCard';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { ExpenseList } from '../components/ExpenseList';
import { ExpenseFormDialog } from '../components/ExpenseFormDialog';
import { ImportExportPanel } from '../components/ImportExportPanel';
import { AccountFilter } from '../components/AccountFilter';
import {
  useGetTransactionsQuery,
  useGetMonthlySummaryQuery,
  useGetCategorySummaryQuery,
} from '../store/expenseApi';
import type { Transaction } from '../types/expense.types';

dayjs.extend(isoWeek);

type PeriodMode = 'week' | 'month';

function getWeekLabel(date: dayjs.Dayjs): string {
  const start = date.startOf('isoWeek');
  const end = date.endOf('isoWeek');
  return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
}

export function ExpenseDashboard() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('month');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().month() + 1);
  const [selectedYear, setSelectedYear] = useState(dayjs().year());

  const now = dayjs();
  const accountIds = selectedAccounts.length > 0 ? selectedAccounts.join(',') : undefined;

  // Always fetch the full month data (needed for both modes)
  const { data: transactions = [], isLoading: txLoading } = useGetTransactionsQuery({
    year: selectedYear,
    month: selectedMonth,
    accountIds,
  });
  const { data: monthlySummary } = useGetMonthlySummaryQuery({
    year: selectedYear,
    month: selectedMonth,
    accountIds,
  });
  const { data: categorySummary = [] } = useGetCategorySummaryQuery({
    year: selectedYear,
    month: selectedMonth,
    type: 'EXPENSE',
    accountIds,
  });

  // Week filtering
  const currentWeek = now.add(weekOffset, 'week');
  const weekStart = currentWeek.startOf('isoWeek');
  const weekEnd = currentWeek.endOf('isoWeek');

  const filteredTransactions = useMemo(() => {
    if (periodMode === 'month') return transactions;
    return transactions.filter((t) => {
      const d = dayjs(t.date);
      return d.isAfter(weekStart.subtract(1, 'day')) && d.isBefore(weekEnd.add(1, 'day'));
    });
  }, [periodMode, transactions, weekStart, weekEnd]);

  const weekSummary = useMemo(() => {
    if (periodMode === 'month') return null;
    let totalExpense = 0;
    let totalIncome = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'EXPENSE') totalExpense += t.amount;
      else totalIncome += t.amount;
    }
    return { totalExpense, totalIncome, net: totalIncome - totalExpense };
  }, [periodMode, filteredTransactions]);

  const activeSummary = periodMode === 'week' && weekSummary ? weekSummary : monthlySummary;

  const todayStr = now.format('YYYY-MM-DD');
  const todayExpense = transactions
    .filter((t) => dayjs(t.date).format('YYYY-MM-DD') === todayStr && t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = filteredTransactions.slice(0, 10);

  const subtitle =
    periodMode === 'week'
      ? getWeekLabel(currentWeek)
      : dayjs(`${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`).format('MMMM YYYY');

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: dayjs().month(i).format('MMMM'),
  }));
  const years = Array.from({ length: 5 }, (_, i) => now.year() - i);

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditingTransaction(null);
  };

  if (txLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <PageHeader title="Finance Dashboard" subtitle={subtitle} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ImportExportPanel year={selectedYear} month={selectedMonth} />
          <AccountFilter value={selectedAccounts} onChange={setSelectedAccounts} />
        </Box>
      </Box>

      {/* Period filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <ToggleButtonGroup
          value={periodMode}
          exclusive
          onChange={(_, val) => val && setPeriodMode(val)}
          size="small"
        >
          <ToggleButton value="month">Monthly</ToggleButton>
          <ToggleButton value="week">Weekly</ToggleButton>
        </ToggleButtonGroup>

        {periodMode === 'month' ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              size="small"
              sx={{ minWidth: 130 }}
            >
              {months.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              size="small"
              sx={{ minWidth: 90 }}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </TextField>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <ToggleButton
              value="prev"
              size="small"
              onClick={() => setWeekOffset((o) => o - 1)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              &lt;
            </ToggleButton>
            <ToggleButton
              value="next"
              size="small"
              onClick={() => setWeekOffset((o) => o + 1)}
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              &gt;
            </ToggleButton>
            {weekOffset !== 0 && (
              <ToggleButton
                value="today"
                size="small"
                onClick={() => setWeekOffset(0)}
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                This Week
              </ToggleButton>
            )}
          </Box>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <ExpenseSummaryCard
            title="Expense"
            amount={activeSummary?.totalExpense ?? 0}
            icon={<ArrowDownwardIcon />}
            color="#d32f2f"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ExpenseSummaryCard
            title="Income"
            amount={activeSummary?.totalIncome ?? 0}
            icon={<ArrowUpwardIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ExpenseSummaryCard
            title="Net Balance"
            amount={activeSummary?.net ?? 0}
            icon={<AccountBalanceWalletIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <ExpenseSummaryCard
            title="Today's Expense"
            amount={todayExpense}
            icon={<TodayIcon />}
            color="#ed6c02"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Box component="h3" sx={{ m: 0, fontWeight: 600 }}>Recent Transactions</Box>
            </Box>
            {recentTransactions.length === 0 ? (
              <EmptyState
                message={`No transactions yet ${periodMode === 'week' ? 'this week' : 'this month'}`}
                actionLabel="Add your first transaction"
                onAction={() => setFormOpen(true)}
              />
            ) : (
              <ExpenseList transactions={recentTransactions} onEdit={handleEdit} />
            )}
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
            <CategoryPieChart data={categorySummary} title="Spending by Category" />
          </Box>
        </Grid>
      </Grid>

      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          setEditingTransaction(null);
          setFormOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      <ExpenseFormDialog
        open={formOpen}
        onClose={handleClose}
        transaction={editingTransaction}
      />
    </Box>
  );
}
