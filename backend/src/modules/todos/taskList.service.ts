import prisma from '../../shared/db/prisma';
import { CreateTaskListInput, UpdateTaskListInput } from './taskList.types';

export async function getAllLists() {
  const lists = await prisma.taskList.findMany({
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { sortOrder: 'asc' },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    icon: list.icon,
    color: list.color,
    sortOrder: list.sortOrder,
    taskCount: list._count.tasks,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  }));
}

export async function createList(data: CreateTaskListInput) {
  return prisma.taskList.create({ data });
}

export async function updateList(id: number, data: UpdateTaskListInput) {
  return prisma.taskList.update({ where: { id }, data });
}

export async function deleteList(id: number) {
  return prisma.taskList.delete({ where: { id } });
}
