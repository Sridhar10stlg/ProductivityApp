import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  note: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  listId: z.number().int().positive().optional(),
  important: z.boolean().optional(),
  myDay: z.boolean().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  note: z.string().nullable().optional(),
  completed: z.boolean().optional(),
  important: z.boolean().optional(),
  myDay: z.boolean().optional(),
  dueDate: z.string().nullable().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  listId: z.number().int().positive().nullable().optional(), // null = take the task out of its list
  sortOrder: z.number().int().optional(),
});

export const taskQuerySchema = z.object({
  view: z.enum(['myday', 'important', 'planned', 'all']).optional(),
  listId: z.string().optional(),
  completed: z.string().optional(),
});

export const createSubTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

export const updateSubTaskSchema = z.object({
  title: z.string().min(1).optional(),
  completed: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
export type CreateSubTaskInput = z.infer<typeof createSubTaskSchema>;
export type UpdateSubTaskInput = z.infer<typeof updateSubTaskSchema>;
