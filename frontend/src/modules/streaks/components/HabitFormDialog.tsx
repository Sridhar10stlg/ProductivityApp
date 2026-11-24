import { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material';
import { useCreateHabitMutation, useUpdateHabitMutation } from '../store/streaksApi';
import { GROUP_LABELS } from '../types/streaks.types';
import type { Habit, HabitGroup, HabitPhase } from '../types/streaks.types';

interface HabitFormDialogProps {
  open: boolean;
  onClose: () => void;
  habit?: Habit | null;
  phases: HabitPhase[];
}

export function HabitFormDialog({ open, onClose, habit, phases }: HabitFormDialogProps) {
  const [createHabit, { isLoading: isCreating }] = useCreateHabitMutation();
  const [updateHabit, { isLoading: isUpdating }] = useUpdateHabitMutation();

  const [name, setName] = useState('');
  const [group, setGroup] = useState<HabitGroup>('ANCHOR');
  const [activeFromPhase, setActiveFromPhase] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(habit?.name ?? '');
    setGroup(habit?.group ?? 'ANCHOR');
    setActiveFromPhase(habit?.activeFromPhase ?? 1);
    setError(null);
  }, [open, habit]);

  const phaseNumbers = phases.map((p) => p.phase).sort((a, b) => a - b);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    try {
      if (habit) await updateHabit({ id: habit.id, data: { name: name.trim(), group, activeFromPhase } }).unwrap();
      else await createHabit({ name: name.trim(), group, activeFromPhase }).unwrap();
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
            select
            label="Active from phase"
            value={activeFromPhase}
            onChange={(e) => setActiveFromPhase(Number(e.target.value))}
            helperText="The habit only counts toward the score from this phase onward"
            fullWidth
          >
            {phaseNumbers.map((p) => (
              <MenuItem key={p} value={p}>Phase {p}</MenuItem>
            ))}
          </TextField>
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
