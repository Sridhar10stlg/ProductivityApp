import { useMemo } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import dayjs from 'dayjs';
import type { DailyTotal } from '../types/expense.types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ExpenseCalendarProps {
  year: number;
  month: number;
  dailyTotals: DailyTotal[];
  selectedDate: string | null;
  onDayClick: (date: string) => void;
}

export function ExpenseCalendar({
  year,
  month,
  dailyTotals,
  selectedDate,
  onDayClick,
}: ExpenseCalendarProps) {
  const cells = useMemo(() => {
    const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    const daysInMonth = firstDay.daysInMonth();
    const startOffset = firstDay.day();
    const totalsByDate = new Map(
      dailyTotals.map((d) => [d.date, { expense: d.expense, income: d.income, net: d.net }])
    );

    const cells: Array<{
      day: number;
      date: string;
      expense: number;
      income: number;
      net: number;
    } | null> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const totals = totalsByDate.get(date);
      cells.push({
        day: d,
        date,
        expense: totals?.expense ?? 0,
        income: totals?.income ?? 0,
        net: totals?.net ?? 0,
      });
    }

    return cells;
  }, [year, month, dailyTotals]);

  const getNetColor = (net: number, hasActivity: boolean) => {
    if (!hasActivity) return 'transparent';
    if (net > 0) return '#e8f5e9';
    if (net < 0) return '#fce4ec';
    return '#fff3e0';
  };

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
          mb: 0.5,
        }}
      >
        {DAY_LABELS.map((label) => (
          <Box key={label} sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 0.5,
        }}
      >
        {cells.map((cell, index) => {
          if (!cell) {
            return <Box key={`empty-${index}`} />;
          }

          const isSelected = selectedDate === cell.date;
          const isToday = cell.date === today;
          const hasActivity = cell.expense > 0 || cell.income > 0;

          return (
            <Paper
              key={cell.date}
              elevation={0}
              onClick={() => onDayClick(cell.date)}
              sx={{
                p: 1,
                minHeight: 70,
                cursor: 'pointer',
                bgcolor: getNetColor(cell.net, hasActivity),
                border: isSelected ? '2px solid' : isToday ? '1px solid' : '1px solid transparent',
                borderColor: isSelected ? 'primary.main' : isToday ? 'primary.light' : 'transparent',
                borderRadius: 1,
                transition: 'all 0.15s',
                '&:hover': {
                  boxShadow: 1,
                  borderColor: 'primary.light',
                },
              }}
            >
              <Typography
                variant="caption"
                fontWeight={isToday ? 700 : 400}
                color={isToday ? 'primary.main' : 'text.primary'}
              >
                {cell.day}
              </Typography>
              {cell.expense > 0 && (
                <Typography variant="caption" display="block" color="error.main" fontWeight={600}>
                  -₹{cell.expense.toFixed(0)}
                </Typography>
              )}
              {cell.income > 0 && (
                <Typography variant="caption" display="block" color="success.main" fontWeight={600}>
                  +₹{cell.income.toFixed(0)}
                </Typography>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
