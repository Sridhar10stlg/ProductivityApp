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
import TableChartIcon from '@mui/icons-material/TableChart';
import { useGetWorklogsQuery } from '../store/worklogApi';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'import' | 'export';
type ExportFormat = 'xlsx' | 'json' | 'csv';

export function WorklogImportExportDialog({ open, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('export');
  const [file, setFile] = useState<File | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { refetch } = useGetWorklogsQuery({});

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

      const res = await fetch('/api/v1/worklog/data/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Import failed');

      setResult(`Imported ${data.data.imported} worklog ${data.data.imported === 1 ? 'entry' : 'entries'} successfully.`);
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      refetch();
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
      const res = await fetch(`/api/v1/worklog/data/export?${params}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `worklog-export.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);

      setResult('Export downloaded successfully.');
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
    onClose();
  };

  const getFileTypeLabel = (name: string) => {
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'Excel';
    if (name.endsWith('.json')) return 'JSON';
    if (name.endsWith('.csv')) return 'CSV';
    return 'File';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableChartIcon sx={{ color: '#7b1fa2' }} />
          <Typography fontWeight={700}>Worklog Import / Export</Typography>
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
            <ToggleButton value="export" sx={{ '&.Mui-selected': { bgcolor: '#f3e5f5', color: '#7b1fa2' } }}>
              <FileDownloadIcon sx={{ mr: 0.5 }} fontSize="small" />
              Export
            </ToggleButton>
            <ToggleButton value="import" sx={{ '&.Mui-selected': { bgcolor: '#f3e5f5', color: '#7b1fa2' } }}>
              <FileUploadIcon sx={{ mr: 0.5 }} fontSize="small" />
              Import
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {mode === 'export' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Export format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                label="Export format"
              >
                <MenuItem value="xlsx">Excel (.xlsx) — includes all columns + row colors</MenuItem>
                <MenuItem value="json">JSON (.json)</MenuItem>
                <MenuItem value="csv">CSV (.csv)</MenuItem>
              </Select>
            </FormControl>
            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Exports all worklog entries with the same column structure as the grid, including row color values.
            </Alert>
          </Box>
        )}

        {mode === 'import' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: file ? '#7b1fa2' : 'divider',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: file ? '#f3e5f5' : 'transparent',
                '&:hover': { borderColor: '#7b1fa2', bgcolor: 'action.hover' },
                transition: 'all 0.2s',
              }}
              onClick={() => fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.json,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {file ? (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <DescriptionIcon sx={{ color: '#7b1fa2' }} />
                  <Typography fontWeight={500}>{file.name}</Typography>
                  <Chip label={getFileTypeLabel(file.name)} size="small" sx={{ bgcolor: '#7b1fa2', color: 'white' }} />
                </Box>
              ) : (
                <>
                  <FileUploadIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">Click to select a file</Typography>
                  <Typography variant="caption" color="text.disabled">
                    Supports Excel (.xlsx), JSON, CSV
                  </Typography>
                </>
              )}
            </Box>

            <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
              Expected columns: <strong>Date, Nature of Work, Account, Project / Work, Important Tasks / Features, Tools / Technology / Skills, Priority, Remarks, Attachments, Row Color</strong>.
              Use the Export first to get the correct template.
            </Alert>
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
            sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#6a1b9a' } }}
          >
            Import
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleExport}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <FileDownloadIcon />}
            sx={{ bgcolor: '#7b1fa2', '&:hover': { bgcolor: '#6a1b9a' } }}
          >
            Export
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
