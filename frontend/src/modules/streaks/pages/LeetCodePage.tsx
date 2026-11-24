import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { LeetCodeFormDialog } from '../components/LeetCodeFormDialog';
import { useDeleteLeetCodeMutation, useGetLeetCodeQuery, useUpdateLeetCodeMutation } from '../store/streaksApi';
import type { Difficulty, LeetCodeEntry } from '../types/streaks.types';

const DIFFICULTY_COLORS: Record<Difficulty, 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
};

const GATE_LABELS = {
  easy: 'Phase 1 gate: easy problems',
  total: 'Phase 2 gate: total problems',
  medium: 'Phase 2 gate: medium problems',
} as const;

export function LeetCodePage() {
  const { data, isLoading } = useGetLeetCodeQuery();
  const [updateEntry] = useUpdateLeetCodeMutation();
  const [deleteEntry] = useDeleteLeetCodeMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LeetCodeEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeetCodeEntry | null>(null);

  if (isLoading || !data) return <LoadingSpinner />;

  const { entries, stats } = data;
  const todayStr = dayjs().format('YYYY-MM-DD');

  const openForm = (entry: LeetCodeEntry | null) => {
    setEditing(entry);
    setFormOpen(true);
  };

  return (
    <Box>
      <PageHeader
        title="LeetCode Log"
        subtitle="One line per problem, solved without AI. Not solved solo means a redo tomorrow."
        actionLabel="Log Problem"
        actionIcon={<AddIcon />}
        onAction={() => openForm(null)}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Problems logged', value: stats.total },
          { label: 'Easy / Medium / Hard', value: `${stats.easy} / ${stats.medium} / ${stats.hard}` },
          { label: 'Solved solo', value: stats.soloRate === null ? '-' : `${Math.round(stats.soloRate * 100)}%` },
          { label: 'Redos due', value: stats.redosDue, alert: stats.redosDue > 0 },
        ].map((s) => (
          <Grid item xs={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                <Typography variant="h5" fontWeight={700} color={s.alert ? 'error.main' : 'text.primary'}>{s.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Phase gates</Typography>
          <Grid container spacing={3}>
            {(Object.keys(GATE_LABELS) as (keyof typeof GATE_LABELS)[]).map((key) => {
              const gate = stats.gates[key];
              const passed = gate.target > 0 && gate.current >= gate.target;
              const pct = gate.target > 0 ? Math.min(100, (gate.current / gate.target) * 100) : 100;
              return (
                <Grid item xs={12} md={4} key={key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">{GATE_LABELS[key]}</Typography>
                    <Typography variant="body2" fontWeight={700} color={passed ? 'success.main' : 'text.primary'}>
                      {passed ? 'Passed' : `${gate.current} / ${gate.target}`}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    color={passed ? 'success' : 'primary'}
                    sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                  />
                </Grid>
              );
            })}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Gate targets can be changed in Settings.
          </Typography>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <EmptyState message="No problems logged yet" actionLabel="Log your first problem" onAction={() => openForm(null)} />
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Problem</TableCell>
                <TableCell>Pattern</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell align="right">Min</TableCell>
                <TableCell>Solo</TableCell>
                <TableCell>Redo</TableCell>
                <TableCell>Notes</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.map((e) => {
                const redoOverdue = e.redoBy && !e.redoDone && e.redoBy <= todayStr;
                return (
                  <TableRow key={e.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(e.date).format('D MMM YY')}</TableCell>
                    <TableCell>
                      {e.link ? <Link href={e.link} target="_blank" rel="noopener noreferrer">{e.problem}</Link> : e.problem}
                    </TableCell>
                    <TableCell>{e.pattern}</TableCell>
                    <TableCell>
                      <Chip size="small" label={e.difficulty.charAt(0) + e.difficulty.slice(1).toLowerCase()} color={DIFFICULTY_COLORS[e.difficulty]} variant="outlined" />
                    </TableCell>
                    <TableCell align="right">{e.minutes ?? ''}</TableCell>
                    <TableCell>{e.solvedSolo ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {e.redoBy ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Tooltip title={e.redoDone ? 'Redo done' : 'Mark redo done'}>
                            <Checkbox
                              size="small"
                              checked={e.redoDone}
                              onChange={(ev) => updateEntry({ id: e.id, data: { redoDone: ev.target.checked } })}
                            />
                          </Tooltip>
                          <Typography variant="caption" color={redoOverdue ? 'error.main' : 'text.secondary'} fontWeight={redoOverdue ? 700 : 400}>
                            by {dayjs(e.redoBy).format('D MMM')}
                          </Typography>
                        </Box>
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240 }}>
                      <Typography variant="body2" noWrap title={e.notes ?? ''}>{e.notes}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <IconButton size="small" onClick={() => openForm(e)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => setDeleteTarget(e)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <LeetCodeFormDialog open={formOpen} onClose={() => setFormOpen(false)} entry={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Problem"
        message={`Remove "${deleteTarget?.problem}" from the log?`}
        onConfirm={async () => {
          if (deleteTarget) await deleteEntry(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
