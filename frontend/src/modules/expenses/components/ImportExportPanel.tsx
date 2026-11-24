import { useRef, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useImportExcelMutation } from '../store/expenseApi';

interface ImportExportPanelProps {
  year?: number;
  month?: number;
}

export function ImportExportPanel({ year, month }: ImportExportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importExcel, { isLoading: isImporting }] = useImportExcelMutation();
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalRows: number;
    imported: number;
    duplicates: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await importExcel(formData).unwrap();
      setImportResult(result);
      setResultDialogOpen(true);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'data' in err
        ? String((err as { data: { error: string } }).data?.error || 'Import failed')
        : 'Import failed. Please check your file format.';
      setError(message);
    }

    // Reset file input so the same file can be selected again
    e.target.value = '';
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (year) params.set('year', String(year));
    if (month) params.set('month', String(month));
    window.open(`/api/v1/data/export?${params.toString()}`, '_blank');
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={isImporting ? <CircularProgress size={16} /> : <FileUploadIcon />}
          onClick={handleImportClick}
          disabled={isImporting}
        >
          Import
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
        >
          Export
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Dialog open={resultDialogOpen} onClose={() => setResultDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Import Complete</DialogTitle>
        <DialogContent>
          {importResult && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography>
                <strong>{importResult.imported}</strong> transactions imported successfully
              </Typography>
              {importResult.duplicates > 0 && (
                <Typography color="text.secondary">
                  {importResult.duplicates} already existed and were not added again
                </Typography>
              )}
              {importResult.skipped > 0 && (
                <Typography color="text.secondary">
                  {importResult.skipped} rows skipped (invalid or zero amount)
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Total rows processed: {importResult.totalRows}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
