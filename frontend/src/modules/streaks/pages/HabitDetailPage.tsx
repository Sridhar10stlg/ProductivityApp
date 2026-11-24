import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Card, CardContent, Grid, IconButton, Tooltip, Typography, alpha } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { scheduledOn, scheduleLabel } from '../utils/schedule';
import { nextStatus } from '../hooks/useCycleHabit';
import { useGetHabitStatsQuery, useSaveDayMutation } from '../store/streaksApi';
import { GROUP_COLORS, GROUP_LABELS } from '../types/streaks.types';
import type { EntryStatus } from '../types/streaks.types';

const FMT = 'YYYY-MM-DD';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HEATMAP_WEEKS = 26;

function Stat({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" fontWeight={800} sx={{ color }}>{value}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Box>
  );
}

function Bars({ values, labels, color }: { values: number[]; labels: string[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 110 }}>
      {values.map((n, i) => (
        <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
          <Typography variant="caption" fontWeight={600}>{n}</Typography>
          <Box sx={{ height: Math.max(3, (n / max) * 70), bgcolor: color, borderRadius: 0.5, opacity: 0.85 }} />
          <Typography variant="caption" color="text.secondary">{labels[i]}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function HabitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const habitId = Number(id);
  const [month, setMonth] = useState(dayjs().startOf('month'));

  const { data, isError } = useGetHabitStatsQuery(habitId, { skip: Number.isNaN(habitId) });
  const [saveDay] = useSaveDayMutation();

  if (isError || Number.isNaN(habitId)) {
    return <Alert severity="error">This habit could not be found.</Alert>;
  }
  if (!data) return <LoadingSpinner />;

  const { habit, entries, today, startDate } = data;
  const color = GROUP_COLORS[habit.group];
  const isDone = (date: string) => entries[date] === 'DONE';

  const toggle = (date: string) => {
    saveDay({ date, data: { entries: { [habit.id]: nextStatus(entries[date]) } } });
  };

  // Totals
  const doneDates = Object.keys(entries).filter(isDone);
  const total = doneDates.length;
  const thisMonth = doneDates.filter((d) => d.startsWith(dayjs().format('YYYY-MM'))).length;
  const thisYear = doneDates.filter((d) => d.startsWith(dayjs().format('YYYY'))).length;

  // Completion since the earlier of plan start and first entry, ignoring not-applicable days.
  const firstDate = [startDate, ...Object.keys(entries)].sort()[0];
  let spanDays = 0;
  for (let d = dayjs(firstDate); !d.isAfter(dayjs(today), 'day'); d = d.add(1, 'day')) {
    const key = d.format(FMT);
    if (scheduledOn(habit, key) || entries[key] === 'DONE') spanDays++;
  }
  // A weekly target expects that many days per week rather than every day.
  if (habit.weeklyTarget) spanDays = Math.max(1, Math.round((spanDays / 7) * habit.weeklyTarget));
  const naDays = Object.keys(entries).filter((d) => entries[d] === 'NA' && d <= today).length;
  const doneToDate = doneDates.filter((d) => d <= today).length;
  const rate = spanDays - naDays > 0 ? doneToDate / (spanDays - naDays) : null;

  // Month calendar
  const first = month.startOf('month');
  const cells: (string | null)[] = [
    ...Array<null>(first.day()).fill(null),
    ...Array.from({ length: month.daysInMonth() }, (_, i) => first.add(i, 'day').format(FMT)),
  ];
  const monthDone = cells.filter((d) => d && isDone(d)).length;

  // Activity heatmap: columns are weeks (Sun-Sat)
  const gridStart = dayjs(today).startOf('week').subtract(HEATMAP_WEEKS - 1, 'week');
  const columns = Array.from({ length: HEATMAP_WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => gridStart.add(w * 7 + d, 'day').format(FMT))
  );

  const byWeekday = WEEKDAYS.map((_, i) => doneDates.filter((d) => dayjs(d).day() === i).length);
  const months = Array.from({ length: 6 }, (_, i) => dayjs().startOf('month').subtract(5 - i, 'month'));
  const monthCounts = months.map((m) => doneDates.filter((d) => d.startsWith(m.format('YYYY-MM'))).length);

  return (
    <Box>
      <PageHeader
        title={habit.name}
        subtitle={`${GROUP_LABELS[habit.group]} habit · ${scheduleLabel(habit.weekdays, habit.weeklyTarget)}${habit.startDate ? ` · counts from ${dayjs(habit.startDate).format('D MMM YYYY')}` : ''}${habit.archived ? ' · archived' : ''}`}
        actionLabel="Back"
        actionIcon={<ArrowBackIcon />}
        onAction={() => navigate(-1)}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-around', py: 3 }}>
              <Stat value={data.current} label={`Current streak (${habit.weeklyTarget ? 'weeks' : 'days'})`} color={color} />
              <Stat value={data.best} label={`Best streak (${habit.weeklyTarget ? 'weeks' : 'days'})`} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <IconButton onClick={() => setMonth(month.subtract(1, 'month'))}><ChevronLeftIcon /></IconButton>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>{month.format('MMMM YYYY')}</Typography>
                  <Typography variant="caption" color="text.secondary">{monthDone} done this month</Typography>
                </Box>
                <IconButton onClick={() => setMonth(month.add(1, 'month'))}><ChevronRightIcon /></IconButton>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75, justifyItems: 'center' }}>
                {WEEKDAYS.map((w) => (
                  <Typography key={w} variant="caption" color="text.secondary">{w}</Typography>
                ))}
                {cells.map((date, i) => {
                  if (!date) return <Box key={`blank-${i}`} />;
                  const status: EntryStatus | undefined = entries[date];
                  const isToday = date === today;
                  return (
                    <Box
                      key={date}
                      onClick={() => toggle(date)}
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: isToday ? 800 : 500,
                        bgcolor: status === 'DONE' ? color : status === 'NA' ? alpha('#607d8b', 0.2) : 'transparent',
                        color: status === 'DONE' ? '#fff' : date > today ? 'text.disabled' : 'text.primary',
                        border: `2px solid ${isToday ? color : 'transparent'}`,
                        '&:hover': { bgcolor: status === 'DONE' ? color : alpha(color, 0.15) },
                      }}
                    >
                      {dayjs(date).date()}
                    </Box>
                  );
                })}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                Click a day to cycle: done, not applicable, missed. A grey circle means not applicable.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>Activity</Typography>
              <Box sx={{ overflowX: 'auto', pb: 1 }}>
                <Box sx={{ display: 'flex', gap: '4px' }}>
                  {columns.map((col, w) => (
                    <Box key={w} sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {col.map((date) => {
                        const status = entries[date];
                        const future = date > today;
                        const label = `${dayjs(date).format('ddd D MMM YYYY')}${status ? (status === 'DONE' ? ' · done' : ' · n/a') : ''}`;
                        return (
                          <Tooltip key={date} title={label} arrow>
                            <Box
                              onClick={() => !future && toggle(date)}
                              sx={{
                                width: 14,
                                height: 14,
                                borderRadius: '3px',
                                cursor: future ? 'default' : 'pointer',
                                bgcolor: status === 'DONE' ? color : status === 'NA' ? alpha('#607d8b', 0.35) : future ? 'transparent' : 'action.hover',
                                border: future ? '1px dashed' : undefined,
                                borderColor: 'divider',
                              }}
                            />
                          </Tooltip>
                        );
                      })}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">Last {HEATMAP_WEEKS} weeks, oldest on the left</Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-around' }}>
              <Stat value={total} label="Total" />
              <Stat value={thisMonth} label="This month" />
              <Stat value={thisYear} label="This year" />
              <Stat value={rate === null ? '-' : `${Math.round(rate * 100)}%`} label="Completion" />
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>By weekday</Typography>
              <Bars values={byWeekday} labels={WEEKDAYS} color={color} />
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>Last 6 months</Typography>
              <Bars values={monthCounts} labels={months.map((m) => m.format('MMM'))} color={color} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
