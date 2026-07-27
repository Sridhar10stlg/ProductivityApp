import prisma from '../../shared/db/prisma';

export async function getAllCategories(type?: string) {
  return prisma.category.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: { name: string; type: string; icon?: string; color?: string }) {
  return prisma.category.create({ data });
}

export async function updateCategory(id: number, data: { name?: string; icon?: string; color?: string }) {
  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: number) {
  const txCount = await prisma.transaction.count({ where: { categoryId: id } });
  if (txCount > 0) {
    throw new Error(`Cannot delete category: ${txCount} transactions are using it`);
  }
  return prisma.category.delete({ where: { id } });
}
