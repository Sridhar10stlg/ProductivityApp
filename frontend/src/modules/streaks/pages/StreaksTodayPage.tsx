import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  ButtonBase,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  MenuItem,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ResultChip } from '../components/ResultChip';
import { StreakChain } from '../components/StreakChain';
import { useCycleHabit } from '../hooks/useCycleHabit';
import {
  useGetConfigQuery,
  useGetDaysQuery,
  useGetSummaryQuery,
  useSaveDayMutation,
} from '../store/streaksApi';
import { GROUP_COLORS, GROUP_LABELS, PLAN_LABELS } from '../types/streaks.types';
import type { DayScore, HabitGroup, PlanType, StreaksSummary } from '../types/streaks.types';

const GROUPS: HabitGroup[] = ['ANCHOR', 'BODY', 'BRAIN'];

function motivation(summary: StreaksSummary, day: DayScore, isToday: boolean): { severity: 'success' | 'info' | 'warning'; text: string } {
  const { current, best } = summary.overall;
  if (!summary.started) {
    return { severity: 'info', text: 'Your plan has not started yet. Check Settings for the start date.' };
  }
  if (!isToday) {
    return { severity: 'info', text: 'You are looking at a past day. Edits here recalculate your streaks.' };
  }
  if (day.result === 'PRODUCTIVE' || day.result === 'PLAN_C_OK') {
    return {
      severity: 'success',
      text: `Today counts. ${current}-day streak${current >= best && current > 1 ? ' - your best so far' : ` (best ${best})`}. Keep the chain going tomorrow.`,
    };
  }
  const more = Math.max(0, day.needed - day.done);
  const brainMore = Math.max(0, day.brainNeeded - day.brainDone);
  const need = brainMore > 0 ? `${more} more habit${more === 1 ? '' : 's'}, including ${brainMore} Brain` : `${more} more habit${more === 1 ? '' : 's'}`;
  if (current > 0) {
    return { severity: 'warning', text: `Your ${current}-day streak is on the line. ${need} to make today productive.` };
  }
  if (best > 0) {
    return { severity: 'info', text: `Fresh start. Your best streak is ${best} days; ${need} makes today a productive day.` };
  }
  return { severity: 'info', text: `Every chain starts with one productive day. ${need} to get yours.` };
}

export function StreaksTodayPage() {
  const todayStr = dayjs().format('YYYY-MM-DD');
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  const { data: config } = useGetConfigQuery();
  const { data: days } = useGetDaysQuery({ from: date, to: date });
  const { data: summary } = useGetSummaryQuery();
  const [saveDay] = useSaveDayMutation();
  const cycle = useCycleHabit();

  const day = days && days[0]?.date === date ? days[0] : undefined;

  useEffect(() => {
    setNotes(day?.notes ?? '');
  }, [day?.date, day?.notes]);

  if (!config || !summary || !day) return <LoadingSpinner />;

  const habits = config.habits.filter((h) => !h.archived);
  const isToday = date === todayStr;
  const message = motivation(summary, day, isToday);
  const streakOf = (id: number) => summary.habits.find((h) => h.habitId === id)?.current ?? 0;
  const week = summary.thisWeek;

  const shiftDate = (delta: number) => setDate(dayjs(date).add(delta, 'day').format('YYYY-MM-DD'));

  return (
    <Box>
      <PageHeader title="Daily Check-in" subtitle="Tap a habit: done, then not applicable, then missed" />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => shiftDate(-1)}><ChevronLeftIcon /></IconButton>
        <TextField
          type="date"
          size="small"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <IconButton onClick={() => shiftDate(1)}><ChevronRightIcon /></IconButton>
        {!isToday && <Button onClick={() => setDate(todayStr)}>Today</Button>}
        <Typography variant="subtitle1" fontWeight={600} sx={{ ml: 1 }}>
          {dayjs(date).format('dddd, D MMMM YYYY')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Week {day.week} · Phase {day.phase}
        </Typography>
      </Box>

      <Alert severity={message.severity} sx={{ mb: 2 }}>{message.text}</Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Today</Typography>
              <Box sx={{ my: 0.5 }}><ResultChip result={day.result} size="medium" /></Box>
              <Typography variant="h5" fontWeight={700}>
                {day.done} / {day.needed}
                <Typography component="span" variant="body2" color="text.secondary"> needed</Typography>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {day.applicable} applicable{day.score !== null ? ` · ${Math.round(day.score * 100)}%` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Brain habits</Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                color={day.brainDone >= day.brainNeeded ? 'success.main' : 'text.primary'}
              >
                {day.brainDone} / {day.brainNeeded}
              </Typography>
              <Typography variant="caption" color="text.secondary">minimum for a productive day</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Productive streak</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                <WhatshotIcon sx={{ color: summary.overall.current > 0 ? '#f57c00' : 'text.disabled' }} />
                <Typography variant="h4" fontWeight={700}>{summary.overall.current}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                best {summary.overall.best} · weekly goal streak {summary.weeklyGoalStreak.current}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">This week</Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                color={week && week.productive >= week.goal ? 'success.main' : 'text.primary'}
              >
                {week ? week.productive : 0} / {week ? week.goal : '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                productive days{week ? ` · ${week.daysLeft} day${week.daysLeft === 1 ? '' : 's'} left` : ''}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <TextField
              select
              size="small"
              label="Plan"
              value={day.plan}
              onChange={(e) => saveDay({ date, data: { plan: e.target.value as PlanType } })}
              sx={{ minWidth: 200 }}
            >
              {(Object.keys(PLAN_LABELS) as PlanType[]).map((p) => (
                <MenuItem key={p} value={p}>{PLAN_LABELS[p]}</MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (day.notes ?? '') && saveDay({ date, data: { notes: notes || null } })}
              sx={{ flexGrow: 1, minWidth: 240 }}
            />
          </Box>

          {GROUPS.map((group) => {
            const groupHabits = habits.filter((h) => h.group === group);
            if (groupHabits.length === 0) return null;
            const color = GROUP_COLORS[group];
            return (
              <Box key={group} sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ color, mb: 1 }}>
                  {GROUP_LABELS[group]}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1 }}>
                  {groupHabits.map((h) => {
                    const active = h.activeFromPhase <= day.phase;
                    const status = day.entries[h.id];
                    const streak = streakOf(h.id);
                    return (
                      <ButtonBase
                        key={h.id}
                        onClick={() => cycle(day, h.id)}
                        sx={{
                          justifyContent: 'flex-start',
                          gap: 1,
                          px: 1.5,
                          py: 1,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: status === 'DONE' ? '#2e7d32' : 'divider',
                          bgcolor: status === 'DONE' ? alpha('#2e7d32', 0.1) : status === 'NA' ? alpha('#607d8b', 0.1) : 'background.paper',
                          opacity: active || status ? 1 : 0.6,
                          borderStyle: active ? 'solid' : 'dashed',
                          textAlign: 'left',
                        }}
                      >
                        {status === 'DONE' ? (
                          <CheckCircleIcon sx={{ color: '#2e7d32' }} />
                        ) : status === 'NA' ? (
                          <RemoveCircleOutlineIcon sx={{ color: '#607d8b' }} />
                        ) : (
                          <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} />
                        )}
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{h.name}</Typography>
                          {!active && (
                            <Typography variant="caption" color="text.secondary">
                              Optional until phase {h.activeFromPhase} (not counted yet)
                            </Typography>
                          )}
                          {active && status === 'NA' && (
                            <Typography variant="caption" color="text.secondary">Not applicable</Typography>
                          )}
                        </Box>
                        {streak > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', color: '#f57c00' }}>
                            <WhatshotIcon fontSize="small" />
                            <Typography variant="caption" fontWeight={700}>{streak}</Typography>
                          </Box>
                        )}
                      </ButtonBase>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Streak chains</Typography>
      <Card>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 90px 1fr' }, columnGap: 2, rowGap: 1.5, alignItems: 'center' }}>
            <Typography variant="body2" fontWeight={700}>Productive days</Typography>
            <Typography variant="caption" color="text.secondary">
              {summary.overall.current} / best {summary.overall.best}
            </Typography>
            <StreakChain chain={summary.overall.chain} size={16} />

            {summary.habits.map((h) => (
              <Box key={h.habitId} sx={{ display: 'contents' }}>
                <Typography variant="body2" noWrap sx={{ color: GROUP_COLORS[h.group] }}>{h.name}</Typography>
                <Typography variant="caption" color="text.secondary">{h.current} / best {h.best}</Typography>
                <StreakChain chain={h.chain} />
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Last 14 days, oldest to newest. Green = done, grey = not applicable (skipped, does not break the chain),
            pink = missed, dashed = today still open. A fully blank past day counts as missed.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
