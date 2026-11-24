import { Request, Response } from 'express';
import * as service from './leetcode.service';
import { createLeetCodeSchema, updateLeetCodeSchema } from './streaks.types';

export async function list(_req: Request, res: Response) {
  const data = await service.getLeetCode();
  res.json({ success: true, data });
}

export async function create(req: Request, res: Response) {
  const data = createLeetCodeSchema.parse(req.body);
  const entry = await service.createLeetCode(data);
  res.status(201).json({ success: true, data: entry });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = updateLeetCodeSchema.parse(req.body);
  const entry = await service.updateLeetCode(id, data);
  res.json({ success: true, data: entry });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await service.deleteLeetCode(id);
  res.json({ success: true, data: null });
}
