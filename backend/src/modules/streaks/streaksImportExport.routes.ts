import { Router } from 'express';
import multer from 'multer';
import { handleImport, handleExport, handleJsonPreview, handleJsonImport, handleJsonExport } from './streaksImportExport.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = file.originalname.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Supported format: Excel (.xlsx)'));
    }
  },
});

const jsonUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.json')) cb(null, true);
    else cb(new Error('Supported format: JSON (.json)'));
  },
});

const router = Router();

router.get('/export', handleExport);
router.post('/import', upload.single('file'), handleImport);

// JSON in the "completions per habit" format (two steps: preview the habits, then import with a mapping)
router.get('/export-json', handleJsonExport);
router.post('/import-json/preview', jsonUpload.single('file'), handleJsonPreview);
router.post('/import-json', jsonUpload.single('file'), handleJsonImport);

export { router as streaksImportExportRoutes };
