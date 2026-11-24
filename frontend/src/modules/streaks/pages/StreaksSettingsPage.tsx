import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Switch,
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
import { scheduleLabel } from '../utils/schedule';
import { StreaksDataCard } from '../components/StreaksDataCard';
import {
  useDeleteHabitMutation,
  useGetConfigQuery,
  useReorderHabitsMutation,
  useUpdateHabitMutation,
  useUpdateSettingsMutation,
} from '../store/streaksApi';
import { GROUP_COLORS, GROUP_LABELS } from '../types/streaks.types';
import type { Habit } from '../types/streaks.types';

interface Notice {
  severity: 'success' | 'error';
  text: string;
}

const pct = (v: number) => String(Math.round(v * 100));

export function StreaksSettingsPage() {
  const { data: config } = useGetConfigQuery();
  const [updateSettings, { isLoading: savingSettings }] = useUpdateSettingsMutation();
  const [updateHabit] = useUpdateHabitMutation();
  const [reorderHabits] = useReorderHabitsMutation();
  const [deleteHabit] = useDeleteHabitMutation();

  // Plan settings form (strings so inputs can be edited freely; parsed on save)
  const [startDate, setStartDate] = useState('');
  const [productive, setProductive] = useState('');
  const [planC, setPlanC] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [bodyMin, setBodyMin] = useState('');
  const [brainMin, setBrainMin] = useState('');
  const [gateEasy, setGateEasy] = useState('');
  const [gateTotal, setGateTotal] = useState('');
  const [gateMedium, setGateMedium] = useState('');
  const [settingsNotice, setSettingsNotice] = useState<Notice | null>(null);

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
    setBodyMin(String(s.bodyNeeded));
    setBrainMin(String(s.brainNeeded));
    setGateEasy(String(s.gateEasy));
    setGateTotal(String(s.gateTotal));
    setGateMedium(String(s.gateMedium));
  }, [config]);

  if (!config) return <LoadingSpinner />;

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
        bodyNeeded: Math.max(0, parseInt(bodyMin, 10) || 0),
        brainNeeded: Math.max(0, parseInt(brainMin, 10) || 0),
        gateEasy: Math.max(0, parseInt(gateEasy, 10) || 0),
        gateTotal: Math.max(0, parseInt(gateTotal, 10) || 0),
        gateMedium: Math.max(0, parseInt(gateMedium, 10) || 0),
      }).unwrap();
      setSettingsNotice({ severity: 'success', text: 'Settings saved. All scores and streaks have been recalculated.' });
    } catch {
      setSettingsNotice({ severity: 'error', text: 'Could not save settings.' });
    }
  };

  const moveHabit = (index: number, delta: number) => {
    const ids = config.habits.map((h) => h.id);
    const target = index + delta;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorderHabits(ids);
  };

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
                    helperText="Week numbers count from this date"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Weekly goal (productive days)', weeklyGoal, setWeeklyGoal, '1 to 7', { inputProps: { min: 1, max: 7 } })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Anchor habits needed (%)', productive, setProductive, 'Share of the day\'s Anchor habits', { inputProps: { min: 1, max: 100 } })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Plan C threshold (%)', planC, setPlanC, 'Anchor share on a Plan C day (sick, drained)', { inputProps: { min: 1, max: 100 } })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Body habits needed', bodyMin, setBodyMin, 'Per day', { inputProps: { min: 0 } })}
                </Grid>
                <Grid item xs={12} sm={6}>
                  {numberField('Brain habits needed', brainMin, setBrainMin, 'Per day', { inputProps: { min: 0 } })}
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">LeetCode gates</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>{numberField('Easy problems', gateEasy, setGateEasy, 'Phase 1', { inputProps: { min: 0 } })}</Grid>
                <Grid item xs={12} sm={4}>{numberField('Total problems', gateTotal, setGateTotal, 'Phase 2', { inputProps: { min: 0 } })}</Grid>
                <Grid item xs={12} sm={4}>{numberField('Medium problems', gateMedium, setGateMedium, 'Phase 2', { inputProps: { min: 0 } })}</Grid>
              </Grid>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                A Productive Day: at least {productive}% of that day's Anchor habits, {bodyMin} Body and {brainMin} Brain habits.
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button variant="contained" onClick={saveSettings} disabled={savingSettings}>Save plan settings</Button>
              </Box>
              {settingsNotice && <Alert severity={settingsNotice.severity} sx={{ mt: 2 }}>{settingsNotice.text}</Alert>}
            </CardContent>
          </Card>
          </Box>

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
                          <span>
                            {scheduleLabel(h.weekdays, h.weeklyTarget)}
                            {h.startDate ? ` · from ${h.startDate}` : ''}
                          </span>
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
