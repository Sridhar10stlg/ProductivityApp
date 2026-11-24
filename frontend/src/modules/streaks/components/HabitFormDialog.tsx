import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useCreateHabitMutation, useUpdateHabitMutation } from '../store/streaksApi';
import { GROUP_LABELS } from '../types/streaks.types';
import { WEEKDAY_SHORT } from '../utils/schedule';
import type { Habit, HabitGroup } from '../types/streaks.types';

type Repeat = 'daily' | 'days' | 'weekly';

const WORKDAYS = [1, 2, 3, 4, 5];
// Monday first in the picker
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface HabitFormDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit | null;
}

export function HabitFormDialog({ open, onClose, habit }: HabitFormDialogProps) {
  const [createHabit, { isLoading: isCreating }] = useCreateHabitMutation();
  const [updateHabit, { isLoading: isUpdating }] = useUpdateHabitMutation();

  const [name, setName] = useState('');
  const [group, setGroup] = useState<HabitGroup>('ANCHOR');
  const [startDate, setStartDate] = useState('');
  const [repeat, setRepeat] = useState<Repeat>('daily');
  const [weekdays, setWeekdays] = useState<number[]>(WORKDAYS);
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? '');
    setGroup(habit?.group ?? 'ANCHOR');
    // A new habit counts from today so past days keep their old total.
    setStartDate(habit ? habit.startDate ?? '' : dayjs().format('YYYY-MM-DD'));
    setRepeat(habit?.weeklyTarget ? 'weekly' : habit?.weekdays ? 'days' : 'daily');
    setWeekdays(habit?.weekdays ?? WORKDAYS);
    setWeeklyTarget(habit?.weeklyTarget ?? 3);
    setError(null);
  }, [open, habit]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (repeat === 'days' && weekdays.length === 0) {
      setError('Pick at least one day the habit happens on.');
      return;
    }
    const payload = {
      name: name.trim(),
      group,
      startDate: startDate || null,
      weekdays: repeat === 'days' && weekdays.length < 7 ? weekdays : null,
      weeklyTarget: repeat === 'weekly' ? weeklyTarget : null,
    };
    try {
      if (habit) await updateHabit({ id: habit.id, data: payload }).unwrap();
      else await createHabit(payload).unwrap();
      onClose();
    } catch {
      setError('Could not save. Habit names must be unique.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{habit ? 'Edit Habit' : 'Add Habit'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!error}
            helperText={error}
            required
            autoFocus
            fullWidth
          />
          <TextField select label="Group" value={group} onChange={(e) => setGroup(e.target.value as HabitGroup)} fullWidth>
            {(Object.keys(GROUP_LABELS) as HabitGroup[]).map((g) => (
              <MenuItem key={g} value={g}>{GROUP_LABELS[g]}</MenuItem>
            ))}
          </TextField>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>How often</Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              fullWidth
              value={repeat}
              onChange={(_, v: Repeat | null) => v && setRepeat(v)}
            >
              <ToggleButton value="daily">Every day</ToggleButton>
              <ToggleButton value="days">Chosen days</ToggleButton>
              <ToggleButton value="weekly">N days a week</ToggleButton>
            </ToggleButtonGroup>

            {repeat === 'days' && (
              <Box sx={{ mt: 1 }}>
                <ToggleButtonGroup
                  size="small"
                  value={weekdays}
                  onChange={(_, v: number[]) => setWeekdays(v)}
                  sx={{ flexWrap: 'wrap' }}
                >
                  {DAY_ORDER.map((d) => (
                    <ToggleButton key={d} value={d} sx={{ px: 1.25 }}>{WEEKDAY_SHORT[d]}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Other days are skipped: they leave the total and never break the streak. To add a one-off date, tick the habit on
                  that day. To skip a date, mark it not applicable.
                </Typography>
              </Box>
            )}

            {repeat === 'weekly' && (
              <Box sx={{ mt: 1 }}>
                <TextField
                  select
                  size="small"
                  label="Days per week"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                  sx={{ minWidth: 160 }}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <MenuItem key={n} value={n}>{n} day{n === 1 ? '' : 's'} a week</MenuItem>
                  ))}
                </TextField>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Do it on any days, Monday to Sunday. It only counts against a day once the week has run out of spare days to
                  reach the target; a streak counts weeks in which you reached it.
                </Typography>
              </Box>
            )}
          </Box>

          <TextField
            label="Counts from"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="The daily total includes this habit from this date on. Leave empty to count it on every day."
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isCreating || isUpdating || !name.trim()}>
          {habit ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
