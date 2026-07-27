import { useState } from 'react';
import { Box, Typography, IconButton, Button, Grid } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ExpenseCalendar } from '../components/ExpenseCalendar';
import { DayExpensePanel } from '../components/DayExpensePanel';
import { AccountFilter } from '../components/AccountFilter';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';
import { useGetDailyTotalsQuery, useGetMonthlySummaryQuery } from '../store/expenseApi';

export function ExpenseCalendarPage() {
  const { year, month, currentDate, goToPrevMonth, goToNextMonth, goToToday } =
    useCalendarNavigation();
  const [selectedDate, setSelectedDate] = useState<string | null>(
    dayjs().format('YYYY-MM-DD')
  );
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);

  const accountIds = selectedAccounts.length > 0 ? selectedAccounts.join(',') : undefined;

  const { data: dailyTotals = [], isLoading } = useGetDailyTotalsQuery({ year, month, accountIds });
  const { data: monthlySummary } = useGetMonthlySummaryQuery({ year, month, accountIds });

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <PageHeader title="Calendar" />
        <AccountFilter value={selectedAccounts} onChange={setSelectedAccounts} />
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={goToPrevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={600} sx={{ minWidth: 180, textAlign: 'center' }}>
            {currentDate.format('MMMM YYYY')}
          </Typography>
          <IconButton onClick={goToNextMonth}>
            <ChevronRightIcon />
          </IconButton>
          <Button size="small" onClick={goToToday}>
            Today
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="error.main" fontWeight={600}>
            Expense: ₹{(monthlySummary?.totalExpense ?? 0).toFixed(2)}
          </Typography>
          <Typography variant="body2" color="success.main" fontWeight={600}>
            Income: ₹{(monthlySummary?.totalIncome ?? 0).toFixed(2)}
          </Typography>
          <Typography
            variant="body1"
            fontWeight={700}
            color={(monthlySummary?.net ?? 0) >= 0 ? 'success.main' : 'error.main'}
          >
            Net: ₹{(monthlySummary?.net ?? 0).toFixed(2)}
          </Typography>
        </Box>
      </Box>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedDate ? 8 : 12}>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
              <ExpenseCalendar
                year={year}
                month={month}
                dailyTotals={dailyTotals}
                selectedDate={selectedDate}
                onDayClick={handleDayClick}
              />
            </Box>
          </Grid>
          {selectedDate && (
            <Grid item xs={12} md={4}>
              <DayExpensePanel date={selectedDate} />
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
