import { useState } from 'react';
import {
  Box,
  Grid,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { MonthlyBarChart } from '../components/MonthlyBarChart';
import { CategoryPieChart } from '../components/CategoryPieChart';
import { AccountFilter } from '../components/AccountFilter';
import {
  useGetYearlySummaryQuery,
  useGetCategorySummaryQuery,
} from '../store/expenseApi';
import type { TransactionType } from '../types/expense.types';

const ALL_MONTHS = 0;

export function ExpenseAnalyticsPage() {
  const [year, setYear] = useState(dayjs().year());
  const [month, setMonth] = useState(ALL_MONTHS);
  const [categoryType, setCategoryType] = useState<TransactionType>('EXPENSE');
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const accountIds = selectedAccounts.length > 0 ? selectedAccounts.join(',') : undefined;

  const { data: yearlySummary, isLoading: yearlyLoading } = useGetYearlySummaryQuery({ year, accountIds });
  const { data: categorySummary = [], isLoading: categoryLoading } = useGetCategorySummaryQuery({
    year,
    month: month || undefined,
    type: categoryType,
    accountIds,
  });

  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: dayjs().month(i).format('MMMM'),
  }));

  // Compute summary for the selected period
  const periodSummary = (() => {
    if (!yearlySummary) return null;
    if (month === ALL_MONTHS) {
      return { totalExpense: yearlySummary.totalExpense, totalIncome: yearlySummary.totalIncome, net: yearlySummary.net };
    }
    const m = yearlySummary.months.find((m) => m.month === month);
    if (!m) return { totalExpense: 0, totalIncome: 0, net: 0 };
    return { totalExpense: m.expense, totalIncome: m.income, net: m.net };
  })();

  const isLoading = yearlyLoading || categoryLoading;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <PageHeader title="Analytics" />
        <AccountFilter value={selectedAccounts} onChange={setSelectedAccounts} />
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          select
          label="Year"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value, 10))}
          size="small"
          sx={{ minWidth: 100 }}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Month"
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value, 10))}
          size="small"
          sx={{ minWidth: 130 }}
        >
          <MenuItem value={ALL_MONTHS}>All Months</MenuItem>
          {months.map((m) => (
            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
          ))}
        </TextField>

        {periodSummary && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body1" color="error.main" fontWeight={600}>
              Expense: ₹{periodSummary.totalExpense.toFixed(2)}
            </Typography>
            <Typography variant="body1" color="success.main" fontWeight={600}>
              Income: ₹{periodSummary.totalIncome.toFixed(2)}
            </Typography>
            <Typography
              variant="body1"
              fontWeight={700}
              color={periodSummary.net >= 0 ? 'success.main' : 'error.main'}
            >
              Net: ₹{periodSummary.net.toFixed(2)}
            </Typography>
          </Box>
        )}
      </Box>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
              <MonthlyBarChart
                data={yearlySummary?.months ?? []}
                title="Monthly Income vs Expense"
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <ToggleButtonGroup
                value={categoryType}
                exclusive
                onChange={(_, val) => val && setCategoryType(val)}
                size="small"
              >
                <ToggleButton value="EXPENSE" sx={{ '&.Mui-selected': { bgcolor: '#fce4ec', color: '#d32f2f' } }}>
                  Expense Categories
                </ToggleButton>
                <ToggleButton value="INCOME" sx={{ '&.Mui-selected': { bgcolor: '#e8f5e9', color: '#2e7d32' } }}>
                  Income Categories
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
              <CategoryPieChart
                data={categorySummary}
                title={`${categoryType === 'EXPENSE' ? 'Expense' : 'Income'} Breakdown${month ? ` - ${dayjs().month(month - 1).format('MMMM')}` : ''}`}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>%</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categorySummary.map((cat) => (
                    <TableRow key={cat.categoryId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: cat.color,
                            }}
                          />
                          {cat.categoryName}
                        </Box>
                      </TableCell>
                      <TableCell align="right">₹{cat.total.toFixed(2)}</TableCell>
                      <TableCell align="right">{cat.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
