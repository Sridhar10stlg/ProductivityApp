import { z } from 'zod';

export const createTaskListSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateTaskListSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

export type CreateTaskListInput = z.infer<typeof createTaskListSchema>;
export type UpdateTaskListInput = z.infer<typeof updateTaskListSchema>;
