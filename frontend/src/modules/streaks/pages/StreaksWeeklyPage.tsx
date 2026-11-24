import { Box, Card, CardContent, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, alpha } from '@mui/material';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';
import { useGetSummaryQuery, useGetWeeklyQuery } from '../store/streaksApi';
import { GROUP_COLORS } from '../types/streaks.types';

// Hit-rate colour: red = this week's weak spot territory, green = solid.
function rateColor(rate: number): string {
  if (rate >= 0.8) return '#2e7d32';
  if (rate >= 0.5) return '#ed6c02';
  return '#d32f2f';
}

export function StreaksWeeklyPage() {
  const { data: weekly } = useGetWeeklyQuery();
  const { data: summary } = useGetSummaryQuery();

  if (!weekly || !summary) return <LoadingSpinner />;

  const currentWeek = summary.thisWeek?.week ?? 0;
  const weeks = [...weekly.weeks].reverse(); // newest first for the Sunday review

  return (
    <Box>
      <PageHeader
        title="Weekly Review"
        subtitle={`Goal: ${weekly.goal} productive days a week. Red habits are the weak spot to fix next week.`}
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Weeks in a row meeting the goal</Typography>
            <Typography variant="h4" fontWeight={700}>{summary.weeklyGoalStreak.current}</Typography>
            <Typography variant="caption" color="text.secondary">best {summary.weeklyGoalStreak.best}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 200 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Productive days so far</Typography>
            <Typography variant="h4" fontWeight={700}>{summary.totals.productiveDays}</Typography>
            <Typography variant="caption" color="text.secondary">of {summary.totals.loggedDays} logged days</Typography>
          </CardContent>
        </Card>
      </Box>

      {weeks.length === 0 ? (
        <EmptyState message="No weeks yet" />
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 330px)' }}>
          <Table size="small" stickyHeader sx={{ '& td, & th': { px: 1, py: 0.5, whiteSpace: 'nowrap' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Dates</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Phase</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Productive</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Plan C ok</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Not yet</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Goal</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Avg</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Weakest habit</TableCell>
                {weekly.habits.map((h) => (
                  <TableCell key={h.id} align="center" sx={{ height: 130, verticalAlign: 'bottom' }}>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', display: 'inline-block', color: GROUP_COLORS[h.group] }}
                    >
                      {h.name}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {weeks.map((w) => (
                <TableRow key={w.week} sx={{ bgcolor: w.week === currentWeek ? alpha('#1976d2', 0.06) : undefined }}>
                  <TableCell sx={{ fontWeight: w.week === currentWeek ? 700 : 400 }}>{w.week}</TableCell>
                  <TableCell>{dayjs(w.start).format('D MMM')} - {dayjs(w.end).format('D MMM')}</TableCell>
                  <TableCell>{w.phase}</TableCell>
                  <TableCell align="center">{w.productive}</TableCell>
                  <TableCell align="center">{w.planCOk}</TableCell>
                  <TableCell align="center">{w.notYet}</TableCell>
                  <TableCell>
                    {w.goalMet === null ? null : (
                      <Chip
                        size="small"
                        label={w.goalMet ? 'Met' : w.week === currentWeek ? 'In progress' : 'Missed'}
                        color={w.goalMet ? 'success' : w.week === currentWeek ? 'default' : 'error'}
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">{w.avgScore !== null ? `${Math.round(w.avgScore * 100)}%` : ''}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: w.weakestHabit ? 'error.main' : undefined }}>{w.weakestHabit ?? ''}</TableCell>
                  {weekly.habits.map((h) => {
                    const rate = w.habitRates[h.id];
                    return (
                      <TableCell
                        key={h.id}
                        align="center"
                        sx={rate == null ? undefined : { bgcolor: alpha(rateColor(rate), 0.15), color: rateColor(rate), fontWeight: 600 }}
                      >
                        {rate == null ? '' : `${Math.round(rate * 100)}%`}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
