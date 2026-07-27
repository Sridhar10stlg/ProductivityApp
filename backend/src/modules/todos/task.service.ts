import prisma from '../../shared/db/prisma';
import dayjs from 'dayjs';
import { CreateTaskInput, UpdateTaskInput, TaskQuery, CreateSubTaskInput, UpdateSubTaskInput } from './task.types';
import { createWorklogFromTask, createWorklogFromSubTask } from '../worklog/worklog.service';

const taskInclude = { subtasks: { orderBy: { sortOrder: 'asc' as const } }, list: true };

function todayRange() {
  const start = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();
  return { start, end };
}

export async function getTasks(query: TaskQuery) {
  const where: Record<string, unknown> = {};
  const { start, end } = todayRange();

  if (query.view === 'myday') {
    where.myDay = true;
    where.myDayDate = { gte: start, lte: end };
  } else if (query.view === 'important') {
    where.important = true;
  } else if (query.view === 'planned') {
    where.dueDate = { not: null };
  } else if (query.listId) {
    where.listId = parseInt(query.listId, 10);
  }
  // 'all' view = no filter

  if (query.completed !== undefined) {
    where.completed = query.completed === 'true';
  }

  return prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ completed: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getTaskById(id: number) {
  return prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });
}

export async function createTask(data: CreateTaskInput) {
  const { start, end } = todayRange();

  return prisma.task.create({
    data: {
      title: data.title,
      note: data.note,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      priority: data.priority || 'NONE',
      listId: data.listId || null,
      important: data.important || false,
      myDay: data.myDay || false,
      myDayDate: data.myDay ? new Date() : undefined,
    },
    include: taskInclude,
  });
}

export async function updateTask(id: number, data: UpdateTaskInput) {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.note !== undefined) updateData.note = data.note;
  if (data.important !== undefined) updateData.important = data.important;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.listId !== undefined) updateData.listId = data.listId;
  if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

  let completingNow = false;
  if (data.completed !== undefined) {
    updateData.completed = data.completed;
    updateData.completedAt = data.completed ? new Date() : null;
    completingNow = data.completed === true;
  }

  if (data.myDay !== undefined) {
    updateData.myDay = data.myDay;
    updateData.myDayDate = data.myDay ? new Date() : null;
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
    include: taskInclude,
  });

  if (completingNow) {
    // Check that it wasn't already completed before this update
    const wasAlreadyCompleted = await prisma.worklogEntry.findFirst({ where: { sourceType: 'TASK', sourceId: id } });
    if (!wasAlreadyCompleted) {
      await createWorklogFromTask({
        taskId: id,
        taskTitle: task.title,
        priority: task.priority,
        completedAt: new Date(),
      });
    }
  }

  return task;
}

export async function deleteTask(id: number) {
  return prisma.task.delete({ where: { id } });
}

// ─── Sub-tasks ──────────────────────────────────────

export async function createSubTask(taskId: number, data: CreateSubTaskInput) {
  return prisma.subTask.create({
    data: { title: data.title, taskId },
  });
}

export async function updateSubTask(id: number, data: UpdateSubTaskInput) {
  const subtask = await prisma.subTask.update({
    where: { id },
    data,
    include: { task: true },
  });

  if (data.completed === true) {
    const existing = await prisma.worklogEntry.findFirst({ where: { sourceType: 'SUBTASK', sourceId: id } });
    if (!existing) {
      await createWorklogFromSubTask({
        subTaskId: id,
        subTaskTitle: subtask.title,
        parentTaskTitle: subtask.task.title,
        priority: subtask.task.priority,
        completedAt: new Date(),
      });
    }
  }

  return subtask;
}

export async function deleteSubTask(id: number) {
  return prisma.subTask.delete({ where: { id } });
}

// ─── Stats ──────────────────────────────────────────

export async function getStats() {
  const { start, end } = todayRange();

  const [myDayCount, importantCount, plannedCount, allCount, lists] = await Promise.all([
    prisma.task.count({ where: { myDay: true, myDayDate: { gte: start, lte: end }, completed: false } }),
    prisma.task.count({ where: { important: true, completed: false } }),
    prisma.task.count({ where: { dueDate: { not: null }, completed: false } }),
    prisma.task.count({ where: { completed: false } }),
    prisma.taskList.findMany({
      select: { id: true, _count: { select: { tasks: { where: { completed: false } } } } },
    }),
  ]);

  const listCounts: Record<number, number> = {};
  for (const list of lists) {
    listCounts[list.id] = list._count.tasks;
  }

  return { myDay: myDayCount, important: importantCount, planned: plannedCount, all: allCount, lists: listCounts };
}
