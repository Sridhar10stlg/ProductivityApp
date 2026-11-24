import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ResultChip } from '../components/ResultChip';
import { useCycleHabit } from '../hooks/useCycleHabit';
import { useGetConfigQuery, useGetDaysQuery, useSaveDayMutation } from '../store/streaksApi';
import { GROUP_COLORS, GROUP_LABELS } from '../types/streaks.types';
import type { HabitGroup, PlanType } from '../types/streaks.types';

const GROUPS: HabitGroup[] = ['ANCHOR', 'BODY', 'BRAIN'];

export function StreaksTrackerPage() {
  const [month, setMonth] = useState(dayjs().startOf('month'));
  const from = month.format('YYYY-MM-DD');
  const to = month.endOf('month').format('YYYY-MM-DD');
  const todayStr = dayjs().format('YYYY-MM-DD');

  const { data: config } = useGetConfigQuery();
  const { data: days } = useGetDaysQuery({ from, to });
  const [saveDay] = useSaveDayMutation();
  const cycle = useCycleHabit();

  if (!config || !days) return <LoadingSpinner />;

  const habits = config.habits.filter((h) => !h.archived);
  const ordered = GROUPS.flatMap((g) => habits.filter((h) => h.group === g));
  const startDate = config.settings.startDate;

  return (
    <Box>
      <PageHeader title="Tracker" subtitle="Click a cell to cycle: done, not applicable, missed" />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => setMonth(month.subtract(1, 'month'))}><ChevronLeftIcon /></IconButton>
        <Typography variant="h6" fontWeight={700} sx={{ minWidth: 160, textAlign: 'center' }}>
          {month.format('MMMM YYYY')}
        </Typography>
        <IconButton onClick={() => setMonth(month.add(1, 'month'))}><ChevronRightIcon /></IconButton>
        <Button onClick={() => setMonth(dayjs().startOf('month'))}>This month</Button>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
          Plan starts {dayjs(startDate).format('D MMM YYYY')}. Grey cells belong to a later phase: you can still log them, but they do not count toward the day's score yet.
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 230px)' }}>
        <Table size="small" stickyHeader sx={{ '& td, & th': { px: 0.5, py: 0.25, whiteSpace: 'nowrap' } }}>
          <TableHead>
            <TableRow>
              <TableCell colSpan={4} sx={{ position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper' }} />
              {GROUPS.map((g) => {
                const count = ordered.filter((h) => h.group === g).length;
                if (count === 0) return null;
                return (
                  <TableCell
                    key={g}
                    colSpan={count}
                    align="center"
                    sx={{ color: GROUP_COLORS[g], fontWeight: 700, borderLeft: '2px solid', borderColor: 'divider' }}
                  >
                    {GROUP_LABELS[g]}
                  </TableCell>
                );
              })}
              <TableCell colSpan={3} />
            </TableRow>
            <TableRow>
              <TableCell sx={{ position: 'sticky', left: 0, zIndex: 3, bgcolor: 'background.paper', fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Wk</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ph</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Plan</TableCell>
              {ordered.map((h, i) => (
                <TableCell
                  key={h.id}
                  align="center"
                  sx={{
                    height: 130,
                    verticalAlign: 'bottom',
                    borderLeft: i === 0 || ordered[i - 1].group !== h.group ? '2px solid' : undefined,
                    borderColor: 'divider',
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block' }}
                  >
                    {h.name}
                  </Typography>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 700 }}>Done</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Score</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Result</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {days.map((d) => {
              const isToday = d.date === todayStr;
              const beforeStart = d.date < startDate;
              return (
                <TableRow
                  key={d.date}
                  sx={{
                    bgcolor: isToday ? alpha('#1976d2', 0.08) : undefined,
                    opacity: beforeStart ? 0.5 : 1,
                  }}
                >
                  <TableCell
                    sx={{
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      bgcolor: isToday ? '#e8f1fb' : 'background.paper',
                      fontWeight: isToday ? 700 : 400,
                    }}
                  >
                    {dayjs(d.date).format('DD MMM')} {d.weekday}
                  </TableCell>
                  <TableCell>{d.week}</TableCell>
                  <TableCell>{d.phase}</TableCell>
                  <TableCell>
                    <Select
                      variant="standard"
                      disableUnderline
                      value={d.plan}
                      onChange={(e) => saveDay({ date: d.date, data: { plan: e.target.value as PlanType } })}
                      sx={{ fontSize: '0.8rem', color: d.plan === 'A' ? 'text.disabled' : 'text.primary' }}
                    >
                      <MenuItem value="A">A</MenuItem>
                      <MenuItem value="B">B</MenuItem>
                      <MenuItem value="C">C</MenuItem>
                    </Select>
                  </TableCell>
                  {ordered.map((h, i) => {
                    const active = h.activeFromPhase <= d.phase;
                    const status = d.entries[h.id];
                    return (
                      <TableCell
                        key={h.id}
                        align="center"
                        onClick={() => cycle(d, h.id)}
                        sx={{
                          cursor: 'pointer',
                          bgcolor: status === 'DONE'
                            ? alpha('#2e7d32', active ? 0.25 : 0.12)
                            : status === 'NA'
                              ? alpha('#607d8b', 0.15)
                              : !active
                                ? '#eceff1'
                                : undefined,
                          borderLeft: i === 0 || ordered[i - 1].group !== h.group ? '2px solid' : undefined,
                          borderColor: 'divider',
                          minWidth: 28,
                          fontWeight: 700,
                          '&:hover': { bgcolor: alpha('#1976d2', 0.15) },
                        }}
                      >
                        {status === 'DONE' ? 'x' : status === 'NA' ? '-' : ''}
                      </TableCell>
                    );
                  })}
                  <TableCell align="center">{d.logged ? `${d.done}/${d.needed}` : ''}</TableCell>
                  <TableCell align="center">{d.score !== null ? `${Math.round(d.score * 100)}%` : ''}</TableCell>
                  <TableCell>{d.logged ? <ResultChip result={d.result} /> : null}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
