import { Request, Response, NextFunction } from 'express';
import { importFromExcel, exportToExcel } from './importExport.service';

export async function handleImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const result = await importFromExcel(req.file.buffer);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function handleExport(req: Request, res: Response, next: NextFunction) {
  try {
    const { year, month, type, accountId } = req.query;

    const buffer = await exportToExcel({
      year: year ? parseInt(year as string, 10) : undefined,
      month: month ? parseInt(month as string, 10) : undefined,
      type: type as string | undefined,
      accountId: accountId ? parseInt(accountId as string, 10) : undefined,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-export.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}
