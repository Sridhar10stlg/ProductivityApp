import prisma from '../../shared/db/prisma';

export async function getAllAccounts() {
  return prisma.account.findMany({
    orderBy: { name: 'asc' },
  });
}

export async function createAccount(data: { name: string; icon?: string; color?: string }) {
  return prisma.account.create({ data });
}

export async function updateAccount(id: number, data: { name?: string; icon?: string; color?: string }) {
  return prisma.account.update({
    where: { id },
    data,
  });
}

export async function deleteAccount(id: number) {
  const txCount = await prisma.transaction.count({ where: { accountId: id } });
  if (txCount > 0) {
    throw new Error(`Cannot delete account: ${txCount} transactions are using it`);
  }
  return prisma.account.delete({ where: { id } });
}
