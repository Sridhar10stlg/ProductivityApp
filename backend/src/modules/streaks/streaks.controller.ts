import { Request, Response } from 'express';
import * as service from './streaks.service';
import {
  createHabitSchema,
  daysQuerySchema,
  dateParamSchema,
  reorderHabitsSchema,
  replacePhasesSchema,
  saveDaySchema,
  updateHabitSchema,
  updateSettingsSchema,
} from './streaks.types';

// ─── Configuration ──────────────────────────────────────────

export async function getConfig(_req: Request, res: Response) {
  const config = await service.getConfig();
  res.json({ success: true, data: config });
}

export async function updateSettings(req: Request, res: Response) {
  const data = updateSettingsSchema.parse(req.body);
  const settings = await service.updateSettings(data);
  res.json({ success: true, data: settings });
}

export async function replacePhases(req: Request, res: Response) {
  const data = replacePhasesSchema.parse(req.body);
  const phases = await service.replacePhases(data);
  res.json({ success: true, data: phases });
}

export async function createHabit(req: Request, res: Response) {
  const data = createHabitSchema.parse(req.body);
  const habit = await service.createHabit(data);
  res.status(201).json({ success: true, data: habit });
}

export async function reorderHabits(req: Request, res: Response) {
  const { ids } = reorderHabitsSchema.parse(req.body);
  const habits = await service.reorderHabits(ids);
  res.json({ success: true, data: habits });
}

export async function updateHabit(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const data = updateHabitSchema.parse(req.body);
  const habit = await service.updateHabit(id, data);
  res.json({ success: true, data: habit });
}

export async function removeHabit(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await service.deleteHabit(id);
  res.json({ success: true, data: null });
}

// ─── Days ───────────────────────────────────────────────────

export async function listDays(req: Request, res: Response) {
  const { from, to } = daysQuerySchema.parse(req.query);
  const days = await service.getDays(from, to);
  res.json({ success: true, data: days });
}

export async function getDay(req: Request, res: Response) {
  const date = dateParamSchema.parse(req.params.date);
  const day = await service.getDay(date);
  res.json({ success: true, data: day });
}

export async function saveDay(req: Request, res: Response) {
  const date = dateParamSchema.parse(req.params.date);
  const data = saveDaySchema.parse(req.body);
  const day = await service.saveDay(date, data);
  res.json({ success: true, data: day });
}

// ─── Reports ────────────────────────────────────────────────

export async function summary(_req: Request, res: Response) {
  const data = await service.getSummary();
  res.json({ success: true, data });
}

export async function weekly(_req: Request, res: Response) {
  const data = await service.getWeekly();
  res.json({ success: true, data });
}
