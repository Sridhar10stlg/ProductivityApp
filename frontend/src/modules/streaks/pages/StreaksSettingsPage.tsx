import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { HabitFormDialog } from '../components/HabitFormDialog';
import { StreaksDataCard } from '../components/StreaksDataCard';
import {
  useDeleteHabitMutation,
  useGetConfigQuery,
  useReorderHabitsMutation,
  useReplacePhasesMutation,
  useUpdateHabitMutation,
  useUpdateSettingsMutation,
} from '../store/streaksApi';
import { GROUP_COLORS, GROUP_LABELS } from '../types/streaks.types';
import type { Habit, HabitPhase } from '../types/streaks.types';

interface PhaseRow {
  phase: number;
  startsInWeek: string;
  brainNeeded: string;
  description: string;
}

interface Notice {
  severity: 'success' | 'error';
  text: string;
}

const pct = (v: number) => String(Math.round(v * 100));

const toPhaseRows = (phases: HabitPhase[]): PhaseRow[] =>
  phases.map((p) => ({
    phase: p.phase,
    startsInWeek: String(p.startsInWeek),
    brainNeeded: String(p.brainNeeded),
    description: p.description ?? '',
  }));

export function StreaksSettingsPage() {
  const { data: config } = useGetConfigQuery();
  const [updateSettings, { isLoading: savingSettings }] = useUpdateSettingsMutation();
  const [replacePhases, { isLoading: savingPhases }] = useReplacePhasesMutation();
  const [updateHabit] = useUpdateHabitMutation();
  const [reorderHabits] = useReorderHabitsMutation();
  const [deleteHabit] = useDeleteHabitMutation();

  // Plan settings form (strings so inputs can be edited freely; parsed on save)
  const [startDate, setStartDate] = useState('');
  const [productive, setProductive] = useState('');
  const [planC, setPlanC] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [gateEasy, setGateEasy] = useState('');
  const [gateTotal, setGateTotal] = useState('');
  const [gateMedium, setGateMedium] = useState('');
  const [phaseRows, setPhaseRows] = useState<PhaseRow[]>([]);
  const [settingsNotice, setSettingsNotice] = useState<Notice | null>(null);
  const [phasesNotice, setPhasesNotice] = useState<Notice | null>(null);
  const [phasesDialogOpen, setPhasesDialogOpen] = useState(false);
  const [phasesError, setPhasesError] = useState<string | null>(null);

  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Habit | null>(null);

  useEffect(() => {
    if (!config) return;
    const s = config.settings;
    setStartDate(s.startDate);
    setProductive(pct(s.productiveThreshold));
    setPlanC(pct(s.planCThreshold));
    setWeeklyGoal(String(s.weeklyGoal));
    setGateEasy(String(s.gateEasy));
    setGateTotal(String(s.gateTotal));
    setGateMedium(String(s.gateMedium));
    setPhaseRows(toPhaseRows(config.phases));
  }, [config]);

  if (!config) return <LoadingSpinner />;

  const activeHabits = config.habits.filter((h) => !h.archived);

  const saveSettings = async () => {
    const productiveN = parseFloat(productive);
    const planCN = parseFloat(planC);
    const goalN = parseInt(weeklyGoal, 10);
    if (!startDate || !(productiveN > 0 && productiveN <= 100) || !(planCN > 0 && planCN <= 100) || !(goalN >= 1 && goalN <= 7)) {
      setSettingsNotice({ severity: 'error', text: 'Check the values: thresholds must be 1-100% and the weekly goal 1-7 days.' });
      return;
    }
    try {
      await updateSettings({
        startDate,
        productiveThreshold: productiveN / 100,
        planCThreshold: planCN / 100,
        weeklyGoal: goalN,
        gateEasy: Math.max(0, parseInt(gateEasy, 10) || 0),
        gateTotal: Math.max(0, parseInt(gateTotal, 10) || 0),
        gateMedium: Math.max(0, parseInt(gateMedium, 10) || 0),
      }).unwrap();
      setSettingsNotice({ severity: 'success', text: 'Settings saved. All scores and streaks have been recalculated.' });
    } catch {
      setSettingsNotice({ severity: 'error', text: 'Could not save settings.' });
    }
  };

  const updatePhaseRow = (index: number, patch: Partial<PhaseRow>) =>
    setPhaseRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addPhase = () => {
    const last = phaseRows[phaseRows.length - 1];
    setPhaseRows([
      ...phaseRows,
      {
        phase: last ? last.phase + 1 : 1,
        startsInWeek: String(last ? (parseInt(last.startsInWeek, 10) || 1) + 4 : 1),
        brainNeeded: last ? last.brainNeeded : '1',
        description: '',
      },
    ]);
  };

  const openPhasesDialog = () => {
    // Start from what is saved, so cancelling discards any half-made edits.
    setPhaseRows(toPhaseRows(config.phases));
    setPhasesError(null);
    setPhasesDialogOpen(true);
  };

  const savePhases = async () => {
    const payload = phaseRows.map((r) => ({
      phase: r.phase,
      startsInWeek: parseInt(r.startsInWeek, 10),
      brainNeeded: parseInt(r.brainNeeded, 10),
      description: r.description.trim() || null,
    }));
    if (payload.some((p) => !(p.startsInWeek >= 1) || !(p.brainNeeded >= 0))) {
      setPhasesError('Start week must be 1 or more and Brain habits needed 0 or more.');
      return;
    }
    try {
      await replacePhases(payload).unwrap();
      setPhasesNotice({ severity: 'success', text: 'Phases saved. All scores and streaks have been recalculated.' });
      setPhasesDialogOpen(false);
    } catch {
      setPhasesError('Could not save phases.');
    }
  };

  const moveHabit = (index: number, delta: number) => {
    const ids = config.habits.map((h) => h.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderHabits(ids);
  };

  const productiveShare = parseFloat(productive) / 100;
  const todayYmd = new Date().toLocaleDateString('en-CA');
  const countedToday = activeHabits.filter((h) => !h.startDate || h.startDate <= todayYmd).length;

  const numberField = (label: string, value: string, set: (v: string) => void, helper?: string, props?: object) => (
    <TextField
      label={label}
      type="number"
      size="small"
      value={value}
      onChange={(e) => set(e.target.value)}
      helperText={helper}
      fullWidth
      {...props}
    />
  );

  return (
    <Box>
      <PageHeader title="Streak Settings" subtitle="Everything the habit tracker calculates from can be changed here" />

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <Box sx={{ mb: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Plan</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start date (day 1)"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText="Week and phase numbers count from this date"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Weekly goal (productive days)', weeklyGoal, setWeeklyGoal, '1 to 7', { inputProps: { min: 1, max: 7 } })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Productive-day threshold (%)', productive, setProductive, 'Share of applicable habits to complete', { inputProps: { min: 1, max: 100 } })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Plan C threshold (%)', planC, setPlanC, 'Lower bar for sick or drained days', { inputProps: { min: 1, max: 100 } })}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">LeetCode gates</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>{numberField('Easy problems', gateEasy, setGateEasy, 'Phase 1', { inputProps: { min: 0 } })}</Grid>
                <Grid item xs={12} sm={4}>{numberField('Total problems', gateTotal, setGateTotal, 'Phase 2', { inputProps: { min: 0 } })}</Grid>
                <Grid item xs={12} sm={4}>{numberField('Medium problems', gateMedium, setGateMedium, 'Phase 2', { inputProps: { min: 0 } })}</Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button variant="contained" onClick={saveSettings} disabled={savingSettings}>Save plan settings</Button>
              </Box>
              {settingsNotice && <Alert severity={settingsNotice.severity} sx={{ mt: 2 }}>{settingsNotice.text}</Alert>}
            </CardContent>
          </Card>
          </Box>

          <Card sx={{ mb: 3 }}>
            <CardActionArea onClick={openPhasesDialog}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>Phases</Typography>
                  <Button size="small" startIcon={<EditIcon fontSize="small" />} component="span">Edit phases</Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Phases set the week-by-week Brain-habit minimum for a productive day. Click to change them.
                </Typography>
                <Table size="small" sx={{ '& td, & th': { px: 1 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Phase</TableCell>
                      <TableCell>From week</TableCell>
                      <TableCell align="center">Brain</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {config.phases.map((p) => {
                      return (
                        <TableRow key={p.phase}>
                          <TableCell>{p.phase}</TableCell>
                          <TableCell>{p.startsInWeek}</TableCell>
                          <TableCell align="center">{p.brainNeeded}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </CardActionArea>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, pb: 2 }}>
              Today a productive day needs {Math.ceil(productiveShare * countedToday - 1e-9)} of {countedToday} habits ({productive}%).
            </Typography>
            {phasesNotice && <Alert severity={phasesNotice.severity} sx={{ m: 2, mt: 0 }}>{phasesNotice.text}</Alert>}
          </Card>

          <StreaksDataCard />
        </Grid>

        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={700}>Habits</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingHabit(null);
                    setHabitDialogOpen(true);
                  }}
                >
                  Add habit
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Switch a habit off to stop it counting without losing its history. Deleting removes its history too.
              </Typography>
              <List dense>
                {config.habits.map((h, i) => (
                  <ListItem
                    key={h.id}
                    divider
                    sx={{ opacity: h.archived ? 0.55 : 1, bgcolor: h.archived ? alpha('#000', 0.03) : undefined }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={h.archived ? 'Off: not counted' : 'On: counted'}>
                          <Switch
                            size="small"
                            checked={!h.archived}
                            onChange={(e) => updateHabit({ id: h.id, data: { archived: !e.target.checked } })}
                          />
                        </Tooltip>
                        <IconButton size="small" disabled={i === 0} onClick={() => moveHabit(i, -1)}><ArrowUpwardIcon fontSize="small" /></IconButton>
                        <IconButton size="small" disabled={i === config.habits.length - 1} onClick={() => moveHabit(i, 1)}><ArrowDownwardIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => { setEditingHabit(h); setHabitDialogOpen(true); }}><EditIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => setDeleteTarget(h)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={h.name}
                      secondary={
                        <Box component="span" sx={{ display: 'inline-flex', gap: 1, alignItems: 'center', mt: 0.25 }}>
                          <Chip
                            size="small"
                            label={GROUP_LABELS[h.group]}
                            sx={{ bgcolor: alpha(GROUP_COLORS[h.group], 0.12), color: GROUP_COLORS[h.group], height: 20 }}
                          />
                          <span>{h.startDate ? `counts from ${h.startDate}` : 'counts every day'}</span>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'span' }}
                      sx={{ pr: 22 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={phasesDialogOpen} onClose={() => setPhasesDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit phases</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Each phase starts in the given week and sets how many Brain habits a productive day needs.
          </Typography>
              <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ '& td, & th': { px: 1.5 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Phase</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Starts in week</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Brain needed</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {phaseRows.map((row, i) => {
                    const isLast = i === phaseRows.length - 1;
                    return (
                      <TableRow key={row.phase}>
                        <TableCell>{row.phase}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.startsInWeek}
                            onChange={(e) => updatePhaseRow(i, { startsInWeek: e.target.value })}
                            inputProps={{ min: 1 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.brainNeeded}
                            onChange={(e) => updatePhaseRow(i, { brainNeeded: e.target.value })}
                            inputProps={{ min: 0 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.description}
                            onChange={(e) => updatePhaseRow(i, { description: e.target.value })}
                            sx={{ minWidth: 280 }}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          {isLast && phaseRows.length > 1 && (
                            <Tooltip title="Remove last phase">
                              <IconButton size="small" onClick={() => setPhaseRows(phaseRows.slice(0, -1))}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </Box>
          {phasesError && <Alert severity="error" sx={{ mt: 2 }}>{phasesError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button startIcon={<AddIcon />} onClick={addPhase} sx={{ mr: 'auto' }}>Add phase</Button>
          <Button onClick={() => setPhasesDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePhases} disabled={savingPhases}>Save phases</Button>
        </DialogActions>
      </Dialog>

      <HabitFormDialog
        open={habitDialogOpen}
        onClose={() => setHabitDialogOpen(false)}
        habit={editingHabit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Habit"
        message={`Delete "${deleteTarget?.name}" and all of its history? To keep the history, switch the habit off instead.`}
        onConfirm={async () => {
          if (deleteTarget) await deleteHabit(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
