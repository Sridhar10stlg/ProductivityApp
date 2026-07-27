import { Router } from 'express';
import multer from 'multer';
import { handleImport, handleExport } from './todoImportExport.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/json',
      'text/csv',
      'text/plain',
    ];
    const ext = file.originalname.toLowerCase();
    if (
      allowed.includes(file.mimetype) ||
      ext.endsWith('.pdf') ||
      ext.endsWith('.xlsx') ||
      ext.endsWith('.xls') ||
      ext.endsWith('.json') ||
      ext.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Supported formats: PDF, Excel (.xlsx), JSON, CSV'));
    }
  },
});

const router = Router();

router.post('/import', upload.single('file'), handleImport);
router.get('/export', handleExport);

export const todoImportExportRoutes = router;
