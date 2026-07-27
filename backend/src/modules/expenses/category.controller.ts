import { Request, Response } from 'express';
import * as categoryService from './category.service';

export async function list(req: Request, res: Response) {
  const type = req.query.type as string | undefined;
  const categories = await categoryService.getAllCategories(type);
  res.json({ success: true, data: categories });
}

export async function create(req: Request, res: Response) {
  const { name, type, icon, color } = req.body;
  if (!name || !type) {
    res.status(400).json({ success: false, error: 'name and type are required' });
    return;
  }
  if (type !== 'EXPENSE' && type !== 'INCOME') {
    res.status(400).json({ success: false, error: 'type must be EXPENSE or INCOME' });
    return;
  }
  const category = await categoryService.createCategory({ name, type, icon, color });
  res.status(201).json({ success: true, data: category });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const { name, icon, color } = req.body;
  const category = await categoryService.updateCategory(id, { name, icon, color });
  res.json({ success: true, data: category });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await categoryService.deleteCategory(id);
  res.json({ success: true, data: null });
}
