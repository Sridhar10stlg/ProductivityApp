import { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DescriptionIcon from '@mui/icons-material/Description';
import { useGetListsQuery } from '../store/todoApi';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'import' | 'export';
type ExportFormat = 'xlsx' | 'json' | 'csv';

export function TodoImportExportDialog({ open, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('import');
  const [file, setFile] = useState<File | null>(null);
  const [listId, setListId] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [exportListId, setExportListId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: lists = [] } = useGetListsQuery();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    setError(null);
    setResult(null);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (listId) formData.append('listId', listId);

      const res = await fetch('/api/v1/tasks/data/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Import failed');

      setResult(
        `Imported ${data.data.tasksImported} tasks and ${data.data.subtasksImported} subtasks into "${data.data.listName}"` +
          (data.data.tasksSkipped > 0 ? `. ${data.data.tasksSkipped} tasks were already in the list and were skipped.` : '')
      );
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ format: exportFormat });
      if (exportListId) params.set('listId', exportListId);

      const res = await fetch(`/api/v1/tasks/data/export?${params}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const extensions: Record<ExportFormat, string> = { xlsx: 'xlsx', json: 'json', csv: 'csv' };
      a.download = `tasks-export.${extensions[exportFormat]}`;
      a.click();
      URL.revokeObjectURL(url);

      setResult('Export downloaded successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setListId('');
    setExportListId('');
    onClose();
  };

  const getFileTypeLabel = (name: string) => {
    if (name.endsWith('.pdf')) return 'PDF';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'Excel';
    if (name.endsWith('.json')) return 'JSON';
    if (name.endsWith('.csv')) return 'CSV';
    return 'File';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {mode === 'import' ? <FileUploadIcon color="primary" /> : <FileDownloadIcon color="primary" />}
          Import / Export Tasks
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2.5, mt: 1 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => { if (v) { setMode(v); setError(null); setResult(null); } }}
            fullWidth
            size="small"
          >
            <ToggleButton value="import">
              <FileUploadIcon sx={{ mr: 0.5 }} fontSize="small" />
              Import
            </ToggleButton>
            <ToggleButton value="export">
              <FileDownloadIcon sx={{ mr: 0.5 }} fontSize="small" />
              Export
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {mode === 'import' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: file ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: file ? 'primary.50' : 'transparent',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                transition: 'all 0.2s',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.json,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {file ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <DescriptionIcon color="primary" />
                  <Typography fontWeight={500}>{file.name}</Typography>
                  <Chip label={getFileTypeLabel(file.name)} size="small" color="primary" variant="outlined" />
                </Box>
              ) : (
                <>
                  <FileUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">
                    Click to select a file
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Supports PDF, Excel (.xlsx), JSON, CSV
                  </Typography>
                </>
              )}
            </Box>

            <FormControl size="small" fullWidth>
              <InputLabel>Import into list (optional)</InputLabel>
              <Select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                label="Import into list (optional)"
              >
                <MenuItem value="">Create new list</MenuItem>
                {lists.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {mode === 'export' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Export format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                label="Export format"
              >
                <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                <MenuItem value="json">JSON (.json)</MenuItem>
                <MenuItem value="csv">CSV (.csv)</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>List to export</InputLabel>
              <Select
                value={exportListId}
                onChange={(e) => setExportListId(e.target.value)}
                label="List to export"
              >
                <MenuItem value="">All lists</MenuItem>
                {lists.map((l) => (
                  <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {result && <Alert severity="success" sx={{ mt: 2 }}>{result}</Alert>}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Close</Button>
        {mode === 'import' ? (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!file || loading}
            startIcon={loading ? <CircularProgress size={18} /> : <FileUploadIcon />}
          >
            Import
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <FileDownloadIcon />}
          >
            Export
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
