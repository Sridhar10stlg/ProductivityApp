import { Request, Response, NextFunction } from 'express';
import { importTasks, exportToExcel, exportToJson, exportToCsv } from './todoImportExport.service';

export async function handleImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const originalName = req.file.originalname.toLowerCase();
    let format: 'pdf' | 'xlsx' | 'json' | 'csv';

    if (originalName.endsWith('.pdf')) {
      format = 'pdf';
    } else if (originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
      format = 'xlsx';
    } else if (originalName.endsWith('.json')) {
      format = 'json';
    } else if (originalName.endsWith('.csv')) {
      format = 'csv';
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file format. Use PDF, Excel, JSON, or CSV.' });
    }

    const listId = req.body.listId ? parseInt(req.body.listId, 10) : undefined;
    const listName = req.body.listName || undefined;

    const result = await importTasks(req.file.buffer, format, listId, listName);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleExport(req: Request, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as string) || 'xlsx';
    const listId = req.query.listId ? parseInt(req.query.listId as string, 10) : undefined;

    switch (format) {
      case 'xlsx': {
        const buffer = await exportToExcel(listId);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks-export.xlsx');
        res.send(buffer);
        break;
      }
      case 'json': {
        const json = await exportToJson(listId);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks-export.json');
        res.send(json);
        break;
      }
      case 'csv': {
        const csv = await exportToCsv(listId);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks-export.csv');
        res.send(csv);
        break;
      }
      default:
        res.status(400).json({ success: false, error: 'Unsupported export format. Use xlsx, json, or csv.' });
    }
  } catch (error) {
    next(error);
  }
}
