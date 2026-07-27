import { Router } from 'express';
import multer from 'multer';
import { handleImport, handleExport } from './importExport.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  },
});

const router = Router();

router.post('/import', upload.single('file'), handleImport);
router.get('/export', handleExport);

export const importExportRoutes = router;
