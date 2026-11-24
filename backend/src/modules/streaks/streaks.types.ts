import { z } from 'zod';

const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const updateSettingsSchema = z.object({
  startDate: ymd.optional(),
  productiveThreshold: z.number().gt(0).max(1).optional(),
  planCThreshold: z.number().gt(0).max(1).optional(),
  weeklyGoal: z.number().int().min(1).max(7).optional(),
  gateEasy: z.number().int().min(0).optional(),
  gateTotal: z.number().int().min(0).optional(),
  gateMedium: z.number().int().min(0).optional(),
});

export const replacePhasesSchema = z
  .object({
    phases: z
      .array(
        z.object({
          phase: z.number().int().min(1),
          startsInWeek: z.number().int().min(1),
          brainNeeded: z.number().int().min(0),
          description: z.string().nullable().optional(),
        })
      )
      .min(1, 'At least one phase is required'),
  })
  .refine((v) => new Set(v.phases.map((p) => p.phase)).size === v.phases.length, {
    message: 'Phase numbers must be unique',
  });

export const habitGroupSchema = z.enum(['ANCHOR', 'BODY', 'BRAIN']);

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  group: habitGroupSchema,
  activeFromPhase: z.number().int().min(1).optional(),
});

export const updateHabitSchema = z.object({
  name: z.string().trim().min(1).optional(),
  group: habitGroupSchema.optional(),
  activeFromPhase: z.number().int().min(1).optional(),
  archived: z.boolean().optional(),
});

export const reorderHabitsSchema = z.object({
  ids: z.array(z.number().int()).min(1),
});

export const saveDaySchema = z.object({
  plan: z.enum(['A', 'B', 'C']).optional(),
  notes: z.string().nullable().optional(),
  // habitId -> DONE | NA, or null to clear (= missed)
  entries: z.record(z.string().regex(/^\d+$/), z.enum(['DONE', 'NA']).nullable()).optional(),
});

export const daysQuerySchema = z.object({
  from: ymd,
  to: ymd,
});

export const dateParamSchema = ymd;

const leetCodeBase = {
  date: ymd,
  problem: z.string().trim().min(1, 'Problem is required'),
  link: z.string().nullable().optional(),
  pattern: z.string().nullable().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  minutes: z.number().int().min(0).nullable().optional(),
  solvedSolo: z.boolean().optional(),
  redoDone: z.boolean().optional(),
  notes: z.string().nullable().optional(),
};

export const createLeetCodeSchema = z.object(leetCodeBase);
export const updateLeetCodeSchema = z.object(leetCodeBase).partial();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type ReplacePhasesInput = z.infer<typeof replacePhasesSchema>;
export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;
export type SaveDayInput = z.infer<typeof saveDaySchema>;
export type CreateLeetCodeInput = z.infer<typeof createLeetCodeSchema>;
export type UpdateLeetCodeInput = z.infer<typeof updateLeetCodeSchema>;
