import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useCreateHabitMutation, useUpdateHabitMutation } from '../store/streaksApi';
import { GROUP_LABELS } from '../types/streaks.types';
import type { Habit, HabitGroup } from '../types/streaks.types';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? '');
    setGroup(habit?.group ?? 'ANCHOR');
    // A new habit counts from today so past days keep their old total.
    setStartDate(habit ? habit.startDate ?? '' : dayjs().format('YYYY-MM-DD'));
    setError(null);
  }, [open, habit]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const start = startDate || null;
    try {
      if (habit) await updateHabit({ id: habit.id, data: { name: name.trim(), group, startDate: start } }).unwrap();
      else await createHabit({ name: name.trim(), group, startDate: start }).unwrap();
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
          <TextField
            label="Counts from"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="The daily total (for example 5/20) includes this habit from this date on. Leave empty to count it on every day."
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
