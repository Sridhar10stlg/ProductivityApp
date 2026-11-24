import { useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress, FormControlLabel, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useImportStreaksMutation } from '../store/streaksApi';
import type { StreaksImportResult } from '../types/streaks.types';

export function StreaksDataCard() {
  const [importStreaks, { isLoading }] = useImportStreaksMutation();
  const [file, setFile] = useState<File | null>(null);
  const [overwriteSettings, setOverwriteSettings] = useState(true);
  const [result, setResult] = useState<StreaksImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!file) return;
    setResult(null);
    setError(null);
    try {
      setResult(await importStreaks({ file, overwriteSettings }).unwrap());
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      const data = (e as { data?: { error?: string } }).data;
      setError(data?.error || 'Import failed');
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight={700}>Import / Export</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Works with the habit tracker workbook (Settings, Tracker and LeetCode log sheets). Importing the same file
          again updates those days instead of duplicating them.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
              setError(null);
            }}
          />
          <Button variant="outlined" startIcon={<FileUploadIcon />} onClick={() => fileRef.current?.click()}>
            {file ? file.name : 'Choose Excel file'}
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!file || isLoading}
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            Import
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} component="a" href="/api/v1/streaks/data/export">
            Export to Excel
          </Button>
        </Box>
        <FormControlLabel
          control={<Checkbox checked={overwriteSettings} onChange={(e) => setOverwriteSettings(e.target.checked)} />}
          label="Also import the start date, thresholds, phases and habit list from the file (replaces what is set here)"
        />

        {result && (
          <Alert severity={result.warnings.length > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
            Imported {result.daysImported} days ({result.entriesImported} habit entries)
            {result.leetCodeImported > 0 ? `, ${result.leetCodeImported} LeetCode problems` : ''}
            {result.settingsImported ? ', and the plan settings' : ''}.
            {result.habitsCreated > 0 ? ` ${result.habitsCreated} new habits added.` : ''}
            {result.leetCodeSkipped > 0 ? ` ${result.leetCodeSkipped} LeetCode rows skipped (duplicates or the example row).` : ''}
            {result.warnings.map((w) => ` ${w}.`)}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </CardContent>
    </Card>
  );
}
