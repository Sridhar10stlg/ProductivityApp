import { Request, Response } from 'express';
import * as service from './taskList.service';
import { createTaskListSchema, updateTaskListSchema } from './taskList.types';

export async function list(_req: Request, res: Response) {
  const lists = await service.getAllLists();
  res.json({ success: true, data: lists });
}

export async function create(req: Request, res: Response) {
  const data = createTaskListSchema.parse(req.body);
  const taskList = await service.createList(data);
  res.status(201).json({ success: true, data: taskList });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = updateTaskListSchema.parse(req.body);
  const taskList = await service.updateList(id, data);
  res.json({ success: true, data: taskList });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await service.deleteList(id);
  res.json({ success: true, data: null });
}
