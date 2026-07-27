import { Request, Response } from 'express';
import * as service from './task.service';
import { createTaskSchema, updateTaskSchema, taskQuerySchema, createSubTaskSchema, updateSubTaskSchema } from './task.types';

export async function list(req: Request, res: Response) {
  const query = taskQuerySchema.parse(req.query);
  const tasks = await service.getTasks(query);
  res.json({ success: true, data: tasks });
}

export async function getById(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const task = await service.getTaskById(id);
  if (!task) {
    res.status(404).json({ success: false, error: 'Task not found' });
    return;
  }
  res.json({ success: true, data: task });
}

export async function create(req: Request, res: Response) {
  const data = createTaskSchema.parse(req.body);
  const task = await service.createTask(data);
  res.status(201).json({ success: true, data: task });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = updateTaskSchema.parse(req.body);
  const task = await service.updateTask(id, data);
  res.json({ success: true, data: task });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await service.deleteTask(id);
  res.json({ success: true, data: null });
}

export async function stats(_req: Request, res: Response) {
  const data = await service.getStats();
  res.json({ success: true, data });
}

// ─── Sub-tasks ──────────────────────────────────────

export async function createSubTask(req: Request, res: Response) {
  const taskId = parseInt(req.params.taskId, 10);
  const data = createSubTaskSchema.parse(req.body);
  const subtask = await service.createSubTask(taskId, data);
  res.status(201).json({ success: true, data: subtask });
}

export async function updateSubTask(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = updateSubTaskSchema.parse(req.body);
  const subtask = await service.updateSubTask(id, data);
  res.json({ success: true, data: subtask });
}

export async function deleteSubTask(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await service.deleteSubTask(id);
  res.json({ success: true, data: null });
}
