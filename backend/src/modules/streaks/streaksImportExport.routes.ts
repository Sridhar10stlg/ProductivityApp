import { Router } from 'express';
import multer from 'multer';
import { handleImport, handleExport } from './streaksImportExport.controller';

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

const router = Router();

router.get('/export', handleExport);
router.post('/import', upload.single('file'), handleImport);

export { router as streaksImportExportRoutes };
