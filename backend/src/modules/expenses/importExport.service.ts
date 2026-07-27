import * as XLSX from 'xlsx';
import prisma from '../../shared/db/prisma';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// Map Excel category names to icons
const CATEGORY_ICON_MAP: Record<string, string> = {
  breakfast: 'LocalCafe',
  lunch: 'Restaurant',
  dinner: 'Restaurant',
  tea: 'LocalCafe',
  'snack / fastfood': 'Restaurant',
  'meat/chicken/fish': 'Restaurant',
  fruit: 'Restaurant',
  vegetables: 'ShoppingCart',
  juice: 'LocalCafe',
  groceries: 'ShoppingCart',
  petrol: 'DirectionsCar',
  transportation: 'DirectionsCar',
  'bike accessories or service': 'DirectionsCar',
  rent: 'Home',
  electronics: 'PhoneAndroid',
  shopping: 'ShoppingBag',
  movie: 'Movie',
  ott: 'Movie',
  recharge: 'PhoneAndroid',
  medicines: 'LocalHospital',
  haircut: 'MoreHoriz',
  beauty: 'MoreHoriz',
  furniture: 'Home',
  family: 'Home',
  sport: 'FitnessCenter',
  party: 'LocalCafe',
  gift: 'CardGiftcard',
  savings: 'Savings',
  'gold sip': 'Savings',
  salary: 'Work',
  bonus: 'Work',
  dividends: 'TrendingUp',
  cashback: 'Replay',
  refunds: 'Replay',
  brokerage: 'TrendingUp',
  'banking charges': 'AccountBalance',
  'self transfer': 'Replay',
  'self-transfer': 'Replay',
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  breakfast: '#4caf50', lunch: '#4caf50', dinner: '#4caf50', tea: '#795548',
  'snack / fastfood': '#ff9800', groceries: '#8bc34a', petrol: '#2196f3',
  transportation: '#2196f3', rent: '#f44336', electronics: '#9c27b0',
  shopping: '#e91e63', movie: '#9c27b0', medicines: '#f44336', salary: '#4caf50',
  savings: '#00bcd4', family: '#3f51b5', recharge: '#607d8b',
};

interface ExcelRow {
  date: string;
  category: string;
  remark: string;
  amountOut: number | null;
  amountIn: number | null;
  wallet: string;
}

function parseExcelRows(buffer: Buffer): ExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });

  const rows: ExcelRow[] = [];
  // Skip header row
  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i] as (string | number | null)[];
    if (!row || !row[0]) continue;

    const amountOutRaw = row[3];
    const amountInRaw = row[5];

    rows.push({
      date: String(row[0]).trim(),
      category: row[1] ? String(row[1]).trim() : 'Unknown',
      remark: row[2] ? String(row[2]).trim() : '',
      amountOut: amountOutRaw != null ? Math.abs(parseFloat(String(amountOutRaw))) : null,
      amountIn: amountInRaw != null ? parseFloat(String(amountInRaw)) : null,
      wallet: row[7] ? String(row[7]).trim() : 'Cash',
    });
  }

  return rows;
}

function parseDate(dateStr: string): Date {
  // Try DD/Mon/YYYY format (e.g., "01/Nov/2025")
  const parsed = dayjs(dateStr, 'DD/MMM/YYYY');
  if (parsed.isValid()) return parsed.toDate();

  // Try YYYY-MM-DD
  const iso = dayjs(dateStr, 'YYYY-MM-DD');
  if (iso.isValid()) return iso.toDate();

  // Try MM/DD/YYYY
  const us = dayjs(dateStr, 'MM/DD/YYYY');
  if (us.isValid()) return us.toDate();

  // Fallback
  return new Date(dateStr);
}

export async function importFromExcel(buffer: Buffer) {
  const rows = parseExcelRows(buffer);

  if (rows.length === 0) {
    throw new Error('No data rows found in the Excel file');
  }

  // Step 1: Collect unique categories and accounts
  const categoryKeys = new Set<string>();
  const accountNames = new Set<string>();

  for (const row of rows) {
    const type = row.amountIn != null ? 'INCOME' : 'EXPENSE';
    categoryKeys.add(`${row.category.toLowerCase()}::${type}`);
    accountNames.add(row.wallet);
  }

  // Step 2: Ensure all accounts exist
  const accountMap = new Map<string, number>();
  for (const name of accountNames) {
    const account = await prisma.account.upsert({
      where: { name },
      update: {},
      create: { name, icon: 'AccountBalance', color: '#607d8b' },
    });
    accountMap.set(name, account.id);
  }

  // Step 3: Ensure all categories exist
  const categoryMap = new Map<string, number>();
  for (const key of categoryKeys) {
    const [nameLower, type] = key.split('::');
    const displayName = rows.find((r) => r.category.toLowerCase() === nameLower)?.category || nameLower;
    const icon = CATEGORY_ICON_MAP[nameLower] || 'MoreHoriz';
    const color = CATEGORY_COLOR_MAP[nameLower] || '#607d8b';

    const category = await prisma.category.upsert({
      where: { name_type: { name: displayName, type } },
      update: {},
      create: { name: displayName, type, icon, color },
    });
    categoryMap.set(key, category.id);
  }

  // Step 4: Create all transactions in a batch
  let imported = 0;
  let skipped = 0;

  // Use batched createMany for performance
  const transactionsToCreate: Array<{
    type: string;
    amount: number;
    description: string | null;
    date: Date;
    categoryId: number;
    accountId: number;
  }> = [];

  for (const row of rows) {
    const isIncome = row.amountIn != null && row.amountIn > 0;
    const type = isIncome ? 'INCOME' : 'EXPENSE';
    const amount = isIncome ? row.amountIn! : row.amountOut ?? 0;

    if (amount <= 0) {
      skipped++;
      continue;
    }

    const categoryKey = `${row.category.toLowerCase()}::${type}`;
    const categoryId = categoryMap.get(categoryKey);
    const accountId = accountMap.get(row.wallet);

    if (!categoryId || !accountId) {
      skipped++;
      continue;
    }

    transactionsToCreate.push({
      type,
      amount,
      description: row.remark || null,
      date: parseDate(row.date),
      categoryId,
      accountId,
    });
  }

  // Batch insert
  const result = await prisma.transaction.createMany({
    data: transactionsToCreate,
  });
  imported = result.count;

  return {
    totalRows: rows.length,
    imported,
    skipped,
    accountsCreated: accountNames.size,
    categoriesCreated: categoryKeys.size,
  };
}

export async function exportToExcel(query: { year?: number; month?: number; type?: string; accountId?: number }) {
  const where: Record<string, unknown> = {};

  if (query.year && query.month) {
    const start = new Date(query.year, query.month - 1, 1);
    const end = new Date(query.year, query.month, 0, 23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  } else if (query.year) {
    const start = new Date(query.year, 0, 1);
    const end = new Date(query.year, 11, 31, 23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }

  if (query.type) where.type = query.type;
  if (query.accountId) where.accountId = query.accountId;

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true, account: true },
    orderBy: { date: 'asc' },
  });

  const excelData = transactions.map((t) => ({
    Date: dayjs(t.date).format('DD/MMM/YYYY'),
    Category: t.category.name,
    Remark: t.description || '',
    'Amount out': t.type === 'EXPENSE' ? -t.amount : null,
    CCY: 'INR',
    'Amount in': t.type === 'INCOME' ? t.amount : null,
    'CCY ': 'INR',
    Wallet: t.account.name,
  }));

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  sheet['!cols'] = [
    { wch: 14 }, // Date
    { wch: 25 }, // Category
    { wch: 30 }, // Remark
    { wch: 14 }, // Amount out
    { wch: 6 },  // CCY
    { wch: 14 }, // Amount in
    { wch: 6 },  // CCY
    { wch: 14 }, // Wallet
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, 'Money Tracker');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}
