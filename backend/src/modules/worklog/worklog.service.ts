import prisma from '../../shared/db/prisma';
import dayjs from 'dayjs';
import { CreateWorklogInput, UpdateWorklogInput, WorklogQuery } from './worklog.types';

export async function getWorklogs(query: WorklogQuery) {
  const where: Record<string, unknown> = {};

  if (query.from || query.to) {
    where.date = {
      ...(query.from ? { gte: dayjs(query.from).startOf('day').toDate() } : {}),
      ...(query.to ? { lte: dayjs(query.to).endOf('day').toDate() } : {}),
    };
  }

  return prisma.worklogEntry.findMany({
    where,
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getWorklogById(id: number) {
  return prisma.worklogEntry.findUnique({ where: { id } });
}

export async function createWorklog(data: CreateWorklogInput) {
  return prisma.worklogEntry.create({
    data: {
      date: new Date(data.date),
      natureOfWork: data.natureOfWork ?? null,
      account: data.account ?? null,
      projectWork: data.projectWork ?? null,
      importantTasksFeatures: data.importantTasksFeatures ?? null,
      toolsTechSkills: data.toolsTechSkills ?? null,
      remarks: data.remarks ?? null,
      attachments: data.attachments ?? null,
      priority: data.priority ?? 'NONE',
      rowColor: data.rowColor ?? null,
      sourceType: data.sourceType ?? 'MANUAL',
      sourceId: data.sourceId ?? null,
    },
  });
}

export async function updateWorklog(id: number, data: UpdateWorklogInput) {
  const updateData: Record<string, unknown> = {};

  if (data.date !== undefined) updateData.date = new Date(data.date);
  if (data.natureOfWork !== undefined) updateData.natureOfWork = data.natureOfWork;
  if (data.account !== undefined) updateData.account = data.account;
  if (data.projectWork !== undefined) updateData.projectWork = data.projectWork;
  if (data.importantTasksFeatures !== undefined) updateData.importantTasksFeatures = data.importantTasksFeatures;
  if (data.toolsTechSkills !== undefined) updateData.toolsTechSkills = data.toolsTechSkills;
  if (data.remarks !== undefined) updateData.remarks = data.remarks;
  if (data.attachments !== undefined) updateData.attachments = data.attachments;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.rowColor !== undefined) updateData.rowColor = data.rowColor;

  return prisma.worklogEntry.update({ where: { id }, data: updateData });
}

export async function deleteWorklog(id: number) {
  return prisma.worklogEntry.delete({ where: { id } });
}

// Called internally when a task or subtask is completed
export async function createWorklogFromTask(params: {
  taskId: number;
  taskTitle: string;
  priority: string;
  completedAt: Date;
}) {
  return prisma.worklogEntry.create({
    data: {
      date: params.completedAt,
      importantTasksFeatures: params.taskTitle,
      priority: params.priority,
      sourceType: 'TASK',
      sourceId: params.taskId,
    },
  });
}

export async function createWorklogFromSubTask(params: {
  subTaskId: number;
  subTaskTitle: string;
  parentTaskTitle: string;
  priority: string;
  completedAt: Date;
}) {
  return prisma.worklogEntry.create({
    data: {
      date: params.completedAt,
      importantTasksFeatures: params.subTaskTitle,
      projectWork: params.parentTaskTitle,
      priority: params.priority,
      sourceType: 'SUBTASK',
      sourceId: params.subTaskId,
    },
  });
}
