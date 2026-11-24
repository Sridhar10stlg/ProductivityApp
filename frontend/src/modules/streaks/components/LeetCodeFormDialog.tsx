import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import { useCreateLeetCodeMutation, useUpdateLeetCodeMutation } from '../store/streaksApi';
import type { Difficulty, LeetCodeEntry } from '../types/streaks.types';

interface LeetCodeFormDialogProps {
  open: boolean;
  onClose: () => void;
  entry?: LeetCodeEntry | null;
}

export function LeetCodeFormDialog({ open, onClose, entry }: LeetCodeFormDialogProps) {
  const [createEntry, { isLoading: isCreating }] = useCreateLeetCodeMutation();
  const [updateEntry, { isLoading: isUpdating }] = useUpdateLeetCodeMutation();

  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [problem, setProblem] = useState('');
  const [link, setLink] = useState('');
  const [pattern, setPattern] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
  const [minutes, setMinutes] = useState<number | ''>('');
  const [solvedSolo, setSolvedSolo] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate(entry?.date ?? dayjs().format('YYYY-MM-DD'));
    setProblem(entry?.problem ?? '');
    setLink(entry?.link ?? '');
    setPattern(entry?.pattern ?? '');
    setDifficulty(entry?.difficulty ?? 'EASY');
    setMinutes(entry?.minutes ?? '');
    setSolvedSolo(entry?.solvedSolo ?? true);
    setNotes(entry?.notes ?? '');
  }, [open, entry]);

  const handleSubmit = async () => {
    if (!problem.trim()) return;
    const data = {
      date,
      problem: problem.trim(),
      link: link.trim() || null,
      pattern: pattern.trim() || null,
      difficulty,
      minutes: minutes === '' ? null : minutes,
      solvedSolo,
      notes: notes.trim() || null,
    };
    if (entry) await updateEntry({ id: entry.id, data });
    else await createEntry(data);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{entry ? 'Edit Problem' : 'Log a Problem'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Problem" value={problem} onChange={(e) => setProblem(e.target.value)} required autoFocus fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} fullWidth>
              <MenuItem value="EASY">Easy</MenuItem>
              <MenuItem value="MEDIUM">Medium</MenuItem>
              <MenuItem value="HARD">Hard</MenuItem>
            </TextField>
          </Box>
          <TextField label="Link" value={link} onChange={(e) => setLink(e.target.value)} fullWidth />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Pattern" value={pattern} onChange={(e) => setPattern(e.target.value)} fullWidth />
            <TextField
              label="Minutes"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
              inputProps={{ min: 0 }}
              fullWidth
            />
          </Box>
          <FormControlLabel
            control={<Checkbox checked={solvedSolo} onChange={(e) => setSolvedSolo(e.target.checked)} />}
            label="Solved solo (no hints). If not, a redo is due the next day."
          />
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isCreating || isUpdating || !problem.trim()}>
          {entry ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
