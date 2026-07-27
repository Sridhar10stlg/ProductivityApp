import { Request, Response } from 'express';
import * as accountService from './account.service';

export async function list(_req: Request, res: Response) {
  const accounts = await accountService.getAllAccounts();
  res.json({ success: true, data: accounts });
}

export async function create(req: Request, res: Response) {
  const { name, icon, color } = req.body;
  if (!name) {
    res.status(400).json({ success: false, error: 'name is required' });
    return;
  }
  const account = await accountService.createAccount({ name, icon, color });
  res.status(201).json({ success: true, data: account });
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const { name, icon, color } = req.body;
  const account = await accountService.updateAccount(id, { name, icon, color });
  res.json({ success: true, data: account });
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  await accountService.deleteAccount(id);
  res.json({ success: true, data: null });
}
