import { Router } from 'express';
import multer from 'multer';
import { handleImport, handleExport } from './worklogImportExport.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (
      ext.endsWith('.xlsx') || ext.endsWith('.xls') ||
      ext.endsWith('.json') || ext.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Supported formats: Excel (.xlsx), JSON, CSV'));
    }
  },
});

const router = Router();

router.get('/export', handleExport);
router.post('/import', upload.single('file'), handleImport);

export { router as worklogImportExportRoutes };
