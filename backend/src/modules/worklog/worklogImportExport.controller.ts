import { Request, Response, NextFunction } from 'express';
import { exportToExcel, exportToJson, exportToCsv, importWorklog } from './worklogImportExport.service';

export async function handleExport(req: Request, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as string) || 'xlsx';

    switch (format) {
      case 'xlsx': {
        const buffer = await exportToExcel();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=worklog-export.xlsx');
        res.send(buffer);
        break;
      }
      case 'json': {
        const json = await exportToJson();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=worklog-export.json');
        res.send(json);
        break;
      }
      case 'csv': {
        const csv = await exportToCsv();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=worklog-export.csv');
        res.send(csv);
        break;
      }
      default:
        res.status(400).json({ success: false, error: 'Unsupported format. Use xlsx, json, or csv.' });
    }
  } catch (error) {
    next(error);
  }
}

export async function handleImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const name = req.file.originalname.toLowerCase();
    let format: 'xlsx' | 'json' | 'csv';

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      format = 'xlsx';
    } else if (name.endsWith('.json')) {
      format = 'json';
    } else if (name.endsWith('.csv')) {
      format = 'csv';
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported format. Use Excel (.xlsx), JSON, or CSV.' });
    }

    const result = await importWorklog(req.file.buffer, format);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
