import { z } from 'zod';

export const updateWorklogSchema = z.object({
  date: z.string().optional(),
  natureOfWork: z.string().nullable().optional(),
  account: z.string().nullable().optional(),
  projectWork: z.string().nullable().optional(),
  importantTasksFeatures: z.string().nullable().optional(),
  toolsTechSkills: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  attachments: z.string().nullable().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  rowColor: z.enum(['gold', 'green', 'red']).nullable().optional(),
});

export const createWorklogSchema = z.object({
  date: z.string(),
  natureOfWork: z.string().nullable().optional(),
  account: z.string().nullable().optional(),
  projectWork: z.string().nullable().optional(),
  importantTasksFeatures: z.string().nullable().optional(),
  toolsTechSkills: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  attachments: z.string().nullable().optional(),
  priority: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH']).optional(),
  rowColor: z.enum(['gold', 'green', 'red']).nullable().optional(),
  sourceType: z.enum(['TASK', 'SUBTASK', 'MANUAL']).optional(),
  sourceId: z.number().int().positive().nullable().optional(),
});

export const worklogQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateWorklogInput = z.infer<typeof createWorklogSchema>;
export type UpdateWorklogInput = z.infer<typeof updateWorklogSchema>;
export type WorklogQuery = z.infer<typeof worklogQuerySchema>;
