import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Typography,
  Paper,
  Chip,
  Tooltip,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Popover,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PaletteIcon from '@mui/icons-material/Palette';
import dayjs from 'dayjs';
import {
  useGetWorklogsQuery,
  useCreateWorklogMutation,
  useUpdateWorklogMutation,
  useDeleteWorklogMutation,
} from '../store/worklogApi';
import type { WorklogEntry, Priority, RowColor, UpdateWorklogData } from '../types/worklog.types';
import { WorklogImportExportDialog } from '../components/WorklogImportExportDialog';

// ─── Constants ───────────────────────────────────────

const PRIORITY_COLORS: Record<Priority, 'default' | 'info' | 'warning' | 'error'> = {
  NONE: 'default',
  LOW: 'info',
  MEDIUM: 'warning',
  HIGH: 'error',
};

const ROW_BG: Record<RowColor, string> = {
  gold: '#fff8e1',
  green: '#e8f5e9',
  red: '#fce4ec',
};

const ROW_BG_HOVER: Record<RowColor, string> = {
  gold: '#fff3cd',
  green: '#c8e6c9',
  red: '#f8bbd0',
};

const COLOR_OPTIONS: { value: RowColor | null; label: string; bg: string; border: string }[] = [
  { value: null, label: 'None', bg: '#f5f5f5', border: '#bdbdbd' },
  { value: 'gold', label: 'Gold', bg: '#ffd54f', border: '#f9a825' },
  { value: 'green', label: 'Green', bg: '#66bb6a', border: '#2e7d32' },
  { value: 'red', label: 'Red', bg: '#ef5350', border: '#b71c1c' },
];

const COLUMNS: { key: keyof WorklogEntry | 'rowColor' | 'actions'; label: string; width: number }[] = [
  { key: 'rowColor', label: '', width: 40 },
  { key: 'date', label: 'Date', width: 130 },
  { key: 'natureOfWork', label: 'Nature of Work', width: 160 },
  { key: 'account', label: 'Account', width: 130 },
  { key: 'projectWork', label: 'Project / Work', width: 160 },
  { key: 'importantTasksFeatures', label: 'Important Tasks / Features', width: 220 },
  { key: 'toolsTechSkills', label: 'Tools / Technology / Skills', width: 200 },
  { key: 'priority', label: 'Priority', width: 120 },
  { key: 'remarks', label: 'Remarks', width: 180 },
  { key: 'attachments', label: 'Attachments', width: 180 },
  { key: 'actions', label: '', width: 48 },
];

// ─── Color Cell ──────────────────────────────────────

interface ColorCellProps {
  rowId: number;
  current: RowColor | null;
  onSave: (id: number, data: UpdateWorklogData) => void;
}

function ColorCell({ rowId, current, onSave }: ColorCellProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const activeBg = current ? ROW_BG[current] : 'transparent';
  const activeBorder = current
    ? COLOR_OPTIONS.find((c) => c.value === current)?.border ?? '#bdbdbd'
    : '#bdbdbd';

  return (
    <>
      <Tooltip title="Set row color">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            width: 22,
            height: 22,
            border: `2px solid ${activeBorder}`,
            bgcolor: activeBg,
            '&:hover': { bgcolor: activeBg, opacity: 0.8 },
            p: 0,
          }}
        >
          {!current && <PaletteIcon sx={{ fontSize: 13, color: 'text.disabled' }} />}
        </IconButton>
      </Tooltip>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 1, display: 'flex', gap: 0.75 } }}
      >
        {COLOR_OPTIONS.map((opt) => (
          <Tooltip key={String(opt.value)} title={opt.label}>
            <Box
              onClick={() => {
                onSave(rowId, { rowColor: opt.value });
                setAnchorEl(null);
              }}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: opt.bg,
                border: `2px solid ${opt.border}`,
                cursor: 'pointer',
                outline: current === opt.value ? `3px solid ${opt.border}` : 'none',
                outlineOffset: 2,
                transition: 'transform 0.1s',
                '&:hover': { transform: 'scale(1.2)' },
              }}
            />
          </Tooltip>
        ))}
      </Popover>
    </>
  );
}

// ─── Editable Cell ───────────────────────────────────

interface EditableCellProps {
  row: WorklogEntry;
  field: keyof WorklogEntry;
  isEditing: boolean;
  onStartEdit: (rowId: number, field: string) => void;
  onSave: (id: number, data: UpdateWorklogData) => void;
}

function EditableCell({ row, field, isEditing, onStartEdit, onSave }: EditableCellProps) {
  const rawValue = row[field];
  const value = rawValue !== null && rawValue !== undefined ? String(rawValue) : '';
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const newVal = e.target.value.trim() || null;
      const oldVal = rawValue ?? null;
      if (newVal !== oldVal) {
        onSave(row.id, { [field]: newVal } as UpdateWorklogData);
      }
    },
    [row.id, field, rawValue, onSave]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
      if (e.key === 'Escape') onStartEdit(-1, '');
    },
    [onStartEdit]
  );

  if (field === 'date') {
    if (isEditing) {
      return (
        <TextField
          type="date"
          defaultValue={dayjs(value).format('YYYY-MM-DD')}
          size="small"
          variant="standard"
          autoFocus
          inputRef={inputRef}
          onBlur={(e) => {
            const newVal = e.target.value || null;
            if (newVal && newVal !== dayjs(value).format('YYYY-MM-DD')) {
              onSave(row.id, { date: newVal });
            }
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          sx={{ width: '100%', '& input': { fontSize: '0.8rem' } }}
        />
      );
    }
    return (
      <Typography
        variant="body2"
        sx={{ cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        onClick={() => onStartEdit(row.id, field)}
      >
        {dayjs(value).format('DD MMM YYYY')}
      </Typography>
    );
  }

  if (field === 'priority') {
    if (isEditing) {
      return (
        <Select
          value={value as Priority}
          size="small"
          variant="standard"
          autoFocus
          open
          onClose={() => onStartEdit(-1, '')}
          onChange={(e) => {
            onSave(row.id, { priority: e.target.value as Priority });
            onStartEdit(-1, '');
          }}
          sx={{ fontSize: '0.8rem', minWidth: 90 }}
        >
          {(['NONE', 'LOW', 'MEDIUM', 'HIGH'] as Priority[]).map((p) => (
            <MenuItem key={p} value={p}>
              <PriorityChip value={p} />
            </MenuItem>
          ))}
        </Select>
      );
    }
    return (
      <Box sx={{ cursor: 'pointer' }} onClick={() => onStartEdit(row.id, field)}>
        <PriorityChip value={value as Priority} />
      </Box>
    );
  }

  if (isEditing) {
    return (
      <TextField
        defaultValue={value}
        size="small"
        variant="standard"
        autoFocus
        multiline={field === 'remarks' || field === 'attachments'}
        maxRows={3}
        inputRef={inputRef}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        sx={{ width: '100%', '& input, & textarea': { fontSize: '0.8rem' } }}
      />
    );
  }

  return (
    <Typography
      variant="body2"
      onClick={() => onStartEdit(row.id, field)}
      sx={{
        cursor: 'pointer',
        fontSize: '0.8rem',
        color: value ? 'text.primary' : 'text.disabled',
        fontStyle: value ? 'normal' : 'italic',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        minHeight: 20,
        '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 0.5 },
        px: 0.5,
        py: 0.25,
        borderRadius: 0.5,
      }}
    >
      {value || 'Click to edit'}
    </Typography>
  );
}

function PriorityChip({ value }: { value: Priority }) {
  return (
    <Chip
      label={value}
      size="small"
      color={PRIORITY_COLORS[value]}
      variant={value === 'NONE' ? 'outlined' : 'filled'}
      sx={{ fontSize: '0.7rem', height: 22 }}
    />
  );
}

// ─── Main Page ───────────────────────────────────────

interface CellEditState {
  rowId: number;
  field: string;
}

export function WorklogPage() {
  const { data: entries = [], isLoading, isError } = useGetWorklogsQuery({});
  const [createWorklog] = useCreateWorklogMutation();
  const [updateWorklog] = useUpdateWorklogMutation();
  const [deleteWorklog] = useDeleteWorklogMutation();

  const [editing, setEditing] = useState<CellEditState | null>(null);
  const [importExportOpen, setImportExportOpen] = useState(false);

  const handleStartEdit = useCallback((rowId: number, field: string) => {
    setEditing(rowId === -1 ? null : { rowId, field });
  }, []);

  const handleSave = useCallback(
    async (id: number, data: UpdateWorklogData) => {
      await updateWorklog({ id, data });
      setEditing(null);
    },
    [updateWorklog]
  );

  const handleDelete = useCallback(async (id: number) => {
    await deleteWorklog(id);
  }, [deleteWorklog]);

  const handleAddRow = useCallback(async () => {
    await createWorklog({ date: dayjs().format('YYYY-MM-DD'), sourceType: 'MANUAL' });
  }, [createWorklog]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load worklog entries.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} color="#7b1fa2">
            Task Worklog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} — tasks auto-populate when completed
          </Typography>
        </Box>
        <Stack direction="row" gap={1}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => setImportExportOpen(true)}
            size="small"
            sx={{ borderColor: '#7b1fa2', color: '#7b1fa2', '&:hover': { borderColor: '#6a1b9a', bgcolor: '#f3e5f5' } }}
          >
            Import / Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            size="small"
            sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#6a1b9a' } }}
          >
            Add Row
          </Button>
        </Stack>
      </Stack>

      {/* Color legend */}
      <Stack
        direction="row"
        gap={2}
        sx={{ px: 3, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
          Row color:
        </Typography>
        {COLOR_OPTIONS.filter((c) => c.value !== null).map((c) => (
          <Stack key={c.value} direction="row" alignItems="center" gap={0.5}>
            <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: c.bg, border: `1.5px solid ${c.border}` }} />
            <Typography variant="caption" color="text.secondary">{c.label}</Typography>
          </Stack>
        ))}
      </Stack>

      {/* Grid */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ flexGrow: 1, overflow: 'auto', borderRadius: 0 }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell
                  key={col.key}
                  sx={{
                    width: col.width,
                    minWidth: col.width,
                    bgcolor: '#f3e5f5',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: '#4a148c',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    py: 1,
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} sx={{ textAlign: 'center', py: 6 }}>
                  <CalendarTodayIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                  <Typography color="text.secondary" variant="body2">
                    No worklog entries yet. Complete a task to auto-populate, or add a row manually.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((row) => {
                const color = row.rowColor as RowColor | null;
                const baseBg = color ? ROW_BG[color] : 'background.paper';
                const hoverBg = color ? ROW_BG_HOVER[color] : '#f3e5f5';

                return (
                  <TableRow
                    key={row.id}
                    sx={{
                      bgcolor: baseBg,
                      '&:hover': { bgcolor: hoverBg },
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        sx={{
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          py: 0.75,
                          px: col.key === 'rowColor' ? 0.5 : 1,
                          verticalAlign: 'middle',
                          width: col.width,
                          minWidth: col.width,
                          maxWidth: col.width,
                        }}
                      >
                        {col.key === 'actions' ? (
                          <Tooltip title="Delete row">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(row.id)}
                              sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : col.key === 'rowColor' ? (
                          <ColorCell rowId={row.id} current={color} onSave={handleSave} />
                        ) : (
                          <EditableCell
                            row={row}
                            field={col.key as keyof WorklogEntry}
                            isEditing={editing?.rowId === row.id && editing?.field === col.key}
                            onStartEdit={handleStartEdit}
                            onSave={handleSave}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer */}
      <Box sx={{ px: 3, py: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: '#fafafa' }}>
        <Typography variant="caption" color="text.disabled">
          Click any cell to edit inline · Enter or click away to save · Click the color dot to highlight a row · Tasks auto-create an entry when marked complete
        </Typography>
      </Box>

      <WorklogImportExportDialog
        open={importExportOpen}
        onClose={() => setImportExportOpen(false)}
      />
    </Box>
  );
}
