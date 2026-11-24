import { Request, Response, NextFunction } from 'express';
import { exportToExcel, importFromExcel } from './streaksImportExport.service';
import { exportJson, importJson, mappingSchema, previewJson } from './streaksJson.service';

export async function handleExport(_req: Request, res: Response, next: NextFunction) {
  try {
    const buffer = await exportToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=habit-tracker-export.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

export async function handleImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    // Defaults to true: the plan start date and phases must come along or imported days will not line up.
    const overwriteSettings = req.query.overwriteSettings !== 'false';
    const result = await importFromExcel(req.file.buffer, { overwriteSettings });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleJsonPreview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    res.json({ success: true, data: await previewJson(req.file.buffer) });
  } catch (error) {
    next(error);
  }
}

export async function handleJsonImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
    let mapping;
    try {
      mapping = mappingSchema.parse(JSON.parse(String(req.body.mapping ?? '[]')));
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid habit mapping' });
    }
    res.json({ success: true, data: await importJson(req.file.buffer, mapping) });
  } catch (error) {
    next(error);
  }
}

export async function handleJsonExport(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await exportJson();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=habit-streaks-export.json');
    res.send(JSON.stringify(data));
  } catch (error) {
    next(error);
  }
}
