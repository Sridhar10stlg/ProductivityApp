import { Request, Response } from 'express';
import * as service from './worklog.service';
import { createWorklogSchema, updateWorklogSchema, worklogQuerySchema } from './worklog.types';

export async function list(req: Request, res: Response) {
  const query = worklogQuerySchema.parse(req.query);
  const entries = await service.getWorklogs(query);
  res.json({ success: true, data: entries });
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const entry = await service.getWorklogById(id);
  if (!entry) {
    res.status(404).json({ success: false, error: 'Worklog entry not found' });
    return;
  }
  res.json({ success: true, data: entry });
}

export async function create(req: Request, res: Response) {
  const data = createWorklogSchema.parse(req.body);
  const entry = await service.createWorklog(data);
  res.status(201).json({ success: true, data: entry });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = updateWorklogSchema.parse(req.body);
  const entry = await service.updateWorklog(id, data);
  res.json({ success: true, data: entry });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await service.deleteWorklog(id);
  res.json({ success: true, data: null });
}
