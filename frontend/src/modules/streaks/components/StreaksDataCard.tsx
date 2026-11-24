import { useRef, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Checkbox, CircularProgress, FormControlLabel, Typography } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useImportStreaksMutation, usePreviewJsonImportMutation } from '../store/streaksApi';
import { JsonImportDialog } from './JsonImportDialog';
import type { JsonImportResult, JsonPreviewHabit, StreaksImportResult } from '../types/streaks.types';

export function StreaksDataCard() {
  const [importStreaks, { isLoading }] = useImportStreaksMutation();
  const [file, setFile] = useState<File | null>(null);
  const [overwriteSettings, setOverwriteSettings] = useState(true);
  const [result, setResult] = useState<StreaksImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // JSON import (habit app export): preview the habits, then match them in a dialog
  const [previewJson, { isLoading: isPreviewing }] = usePreviewJsonImportMutation();
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [jsonHabits, setJsonHabits] = useState<JsonPreviewHabit[]>([]);
  const [jsonResult, setJsonResult] = useState<JsonImportResult | null>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  const closeJson = () => {
    setJsonFile(null);
    setJsonHabits([]);
    if (jsonRef.current) jsonRef.current.value = '';
  };

  const handleJsonChosen = async (picked: File | undefined) => {
    if (!picked) return;
    setJsonResult(null);
    setError(null);
    try {
      setJsonHabits(await previewJson(picked).unwrap());
      setJsonFile(picked);
    } catch (e) {
      const data = (e as { data?: { error?: string } }).data;
      setError(data?.error || 'Could not read that JSON file');
      closeJson();
    }
  };

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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mt: 1, mb: 1 }}>
          <input
            ref={jsonRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => handleJsonChosen(e.target.files?.[0])}
          />
          <Button
            variant="outlined"
            startIcon={isPreviewing ? <CircularProgress size={16} /> : <FileUploadIcon />}
            onClick={() => jsonRef.current?.click()}
            disabled={isPreviewing}
          >
            Import habits JSON
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} component="a" href="/api/v1/streaks/data/export-json">
            Export to JSON
          </Button>
          <Typography variant="caption" color="text.secondary">
            JSON lists each habit with its completed dates, as exported by other habit apps.
          </Typography>
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
        {jsonResult && (
          <Alert severity={jsonResult.warnings.length > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
            Added {jsonResult.entriesAdded} completions across {jsonResult.daysCreated} new days
            {jsonResult.entriesAlreadyDone > 0 ? ` (${jsonResult.entriesAlreadyDone} were already recorded)` : ''}.
            {jsonResult.habitsCreated > 0 ? ` ${jsonResult.habitsCreated} new habits created.` : ''}
            {jsonResult.warnings.map((w) => ` ${w}.`)}
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <JsonImportDialog
          file={jsonFile}
          habits={jsonHabits}
          onClose={closeJson}
          onDone={(r) => {
            setJsonResult(r);
            closeJson();
          }}
        />
      </CardContent>
    </Card>
  );
}
