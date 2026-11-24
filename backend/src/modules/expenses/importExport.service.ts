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

// Accepted header names (lowercased, non-alphanumerics stripped) for each logical column.
const HEADER_ALIASES: Record<string, string[]> = {
  date: ['date', 'transactiondate', 'txndate', 'day'],
  category: ['category', 'categoryname'],
  remark: ['remark', 'remarks', 'description', 'note', 'notes', 'memo', 'details'],
  out: ['amountout', 'expense', 'expenses', 'debit', 'withdrawal', 'out'],
  in: ['amountin', 'income', 'credit', 'deposit', 'in'],
  amount: ['amount', 'amt', 'value'],
  type: ['type', 'transactiontype'],
  wallet: ['wallet', 'account', 'accountname', 'paymentmethod'],
};

const normalizeHeader = (h: unknown) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

function mapColumns(headerRow: unknown[]): Record<string, number> {
  const normalized = headerRow.map(normalizeHeader);
  const cols: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) cols[field] = idx;
  }
  return cols;
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isNaN(n) ? null : n;
}

function parseExcelRows(buffer: Buffer): ExcelRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true });

  // Find the header row (tolerates title rows above it): first row with both Date and Category.
  let headerIdx = -1;
  let cols: Record<string, number> = {};
  for (let i = 0; i < Math.min(rawData.length, 10); i++) {
    const candidate = mapColumns((rawData[i] as unknown[]) || []);
    if (candidate.date !== undefined && candidate.category !== undefined) {
      headerIdx = i;
      cols = candidate;
      break;
    }
  }
  if (headerIdx < 0) {
    throw new Error('Could not find a header row with "Date" and "Category" columns');
  }
  const hasAmounts = cols.out !== undefined || cols.in !== undefined || cols.amount !== undefined;
  if (!hasAmounts) {
    throw new Error('No amount column found (expected "Amount In"/"Amount Out" or "Amount")');
  }

  const cell = (row: unknown[], field: string) => (cols[field] !== undefined ? row[cols[field]] : undefined);

  const rows: ExcelRow[] = [];
  for (let i = headerIdx + 1; i < rawData.length; i++) {
    const row = rawData[i] as unknown[];
    const rawDate = row && cell(row, 'date');
    if (!rawDate) continue;

    let amountOut = toNumber(cell(row, 'out'));
    let amountIn = toNumber(cell(row, 'in'));

    // Single "Amount" column: use a Type column if present, otherwise the sign (negative = expense).
    const single = toNumber(cell(row, 'amount'));
    if (amountOut == null && amountIn == null && single != null) {
      const typeText = String(cell(row, 'type') ?? '').toLowerCase();
      const isIncome = typeText ? typeText.startsWith('inc') || typeText.startsWith('cr') : single > 0;
      if (isIncome) amountIn = Math.abs(single);
      else amountOut = Math.abs(single);
    }

    const category = cell(row, 'category');
    const remark = cell(row, 'remark');
    const wallet = cell(row, 'wallet');

    rows.push({
      date: rawDate instanceof Date ? dayjs(rawDate).format('YYYY-MM-DD') : String(rawDate).trim(),
      category: category ? String(category).trim() : 'Unknown',
      remark: remark ? String(remark).trim() : '',
      amountOut: amountOut != null ? Math.abs(amountOut) : null,
      amountIn,
      wallet: wallet ? String(wallet).trim() : 'Cash',
    });
  }

  return rows;
}

const DATE_FORMATS = ['DD/MMM/YYYY', 'DD-MMM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY', 'MM/DD/YYYY'];

function parseDate(dateStr: string): Date {
  const parsed = dayjs(dateStr, DATE_FORMATS, true);
  if (parsed.isValid()) return parsed.toDate();
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
