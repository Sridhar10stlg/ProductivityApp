import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useGetConfigQuery, useImportJsonMutation } from '../store/streaksApi';
import { GROUP_LABELS } from '../types/streaks.types';
import type { HabitGroup, JsonImportResult, JsonMappingItem, JsonPreviewHabit } from '../types/streaks.types';

interface Props {
  file: File | null;
  habits: JsonPreviewHabit[];
  onClose: () => void;
  onDone: (result: JsonImportResult) => void;
}

const GROUPS: HabitGroup[] = ['ANCHOR', 'BODY', 'BRAIN'];

// Select values: "skip", "map:<habitId>" or "create:<GROUP>"
const initialChoice = (h: JsonPreviewHabit) =>
  /productive day|day well spent|well spent/i.test(h.name) ? 'wellspent' : h.suggestedHabitId ? `map:${h.suggestedHabitId}` : 'skip';

function toMapping(index: number, choice: string): JsonMappingItem {
  if (choice === 'wellspent') return { index, action: 'wellSpent' };
  if (choice.startsWith('map:')) return { index, action: 'map', habitId: Number(choice.slice(4)) };
  if (choice.startsWith('create:')) return { index, action: 'create', group: choice.slice(7) as HabitGroup, activeFromPhase: 1 };
  return { index, action: 'skip' };
}

export function JsonImportDialog({ file, habits, onClose, onDone }: Props) {
  const { data: config } = useGetConfigQuery();
  const [importJson, { isLoading }] = useImportJsonMutation();
  const [choices, setChoices] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setChoices(Object.fromEntries(habits.map((h) => [h.index, initialChoice(h)])));
    setError(null);
  }, [habits]);

  const open = file !== null && habits.length > 0;
  const included = habits.filter((h) => (choices[h.index] ?? 'skip') !== 'skip');
  const completions = included.reduce((sum, h) => sum + h.completions, 0);

  const submit = async () => {
    if (!file) return;
    setError(null);
    try {
      const mapping = habits.map((h) => toMapping(h.index, choices[h.index] ?? 'skip'));
      onDone(await importJson({ file, mapping }).unwrap());
    } catch (e) {
      setError((e as { data?: { error?: string } }).data?.error || 'Import failed');
    }
  };

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>Match habits from the file</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Every completion in the file becomes a "done" entry on that date. Nothing is removed, and importing the same
          file again adds nothing twice. Habits set to Skip are ignored. A new habit counts toward your daily score
          straight away, so only create the ones you want scored.
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>In the file</TableCell>
              <TableCell align="right">Completions</TableCell>
              <TableCell>Range</TableCell>
              <TableCell sx={{ minWidth: 230 }}>Import as</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {habits.map((h) => (
              <TableRow key={h.index}>
                <TableCell>
                  {h.emoji ? `${h.emoji} ` : ''}{h.name}
                  {h.frequency !== 'DAILY' && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {h.frequency.toLowerCase()} habit, imported as daily completions
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">{h.completions}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{h.first ? `${h.first} to ${h.last}` : '-'}</TableCell>
                <TableCell>
                  <Select
                    size="small"
                    fullWidth
                    value={choices[h.index] ?? 'skip'}
                    onChange={(e) => setChoices({ ...choices, [h.index]: e.target.value })}
                  >
                    <MenuItem value="skip">Skip</MenuItem>
                    <MenuItem value="wellspent">Mark days as Day well spent</MenuItem>
                    {GROUPS.map((g) => (
                      <MenuItem key={g} value={`create:${g}`}>New habit ({GROUP_LABELS[g]})</MenuItem>
                    ))}
                    {config?.habits.map((c) => (
                      <MenuItem key={c.id} value={`map:${c.id}`}>
                        {c.name}{c.archived ? ' (archived)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, pl: 2 }}>
          {included.length} of {habits.length} habits, {completions} completions
        </Typography>
        <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={isLoading || included.length === 0}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}
