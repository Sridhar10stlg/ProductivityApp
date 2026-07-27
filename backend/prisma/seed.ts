import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expenseCategories = [
  { name: 'Food', icon: 'Restaurant', color: '#4caf50', type: 'EXPENSE' },
  { name: 'Transport', icon: 'DirectionsCar', color: '#2196f3', type: 'EXPENSE' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#e91e63', type: 'EXPENSE' },
  { name: 'Bills', icon: 'Receipt', color: '#ff9800', type: 'EXPENSE' },
  { name: 'Entertainment', icon: 'Movie', color: '#9c27b0', type: 'EXPENSE' },
  { name: 'Health', icon: 'LocalHospital', color: '#f44336', type: 'EXPENSE' },
  { name: 'Education', icon: 'School', color: '#00bcd4', type: 'EXPENSE' },
  { name: 'Other', icon: 'MoreHoriz', color: '#607d8b', type: 'EXPENSE' },
];

const incomeCategories = [
  { name: 'Salary', icon: 'Work', color: '#4caf50', type: 'INCOME' },
  { name: 'Freelance', icon: 'Laptop', color: '#2196f3', type: 'INCOME' },
  { name: 'Investment', icon: 'TrendingUp', color: '#ff9800', type: 'INCOME' },
  { name: 'Gift', icon: 'CardGiftcard', color: '#e91e63', type: 'INCOME' },
  { name: 'Refund', icon: 'Replay', color: '#00bcd4', type: 'INCOME' },
  { name: 'Other', icon: 'MoreHoriz', color: '#607d8b', type: 'INCOME' },
];

const defaultAccounts = [
  { name: 'Cash', icon: 'AccountBalanceWallet', color: '#4caf50' },
];

async function main() {
  console.log('Seeding categories and accounts...');

  for (const category of [...expenseCategories, ...incomeCategories]) {
    await prisma.category.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }

  for (const account of defaultAccounts) {
    await prisma.account.upsert({
      where: { name: account.name },
      update: {},
      create: account,
    });
  }

  // Default task list
  const existingList = await prisma.taskList.findFirst({ where: { name: 'Personal' } });
  if (!existingList) {
    await prisma.taskList.create({
      data: { name: 'Personal', icon: 'Person', color: '#388e3c' },
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
