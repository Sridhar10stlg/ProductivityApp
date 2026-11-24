import { Request, Response, NextFunction } from 'express';
import { exportToExcel, importFromExcel } from './streaksImportExport.service';

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
