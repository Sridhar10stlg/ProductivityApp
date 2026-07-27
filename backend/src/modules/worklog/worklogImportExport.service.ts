import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = new PrismaClient() as any;

// ─── Column headers matching the worklog grid ────────

const HEADERS = [
  'Date',
  'Nature of Work',
  'Account',
  'Project / Work',
  'Important Tasks / Features',
  'Tools / Technology / Skills',
  'Priority',
  'Remarks',
  'Attachments',
  'Row Color',
];

// ─── Export ──────────────────────────────────────────

async function getExportData() {
  return db.worklogEntry.findMany({
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function entriesToRows(entries: any[]) {
  return entries.map((e) => ({
    'Date': dayjs(e.date).format('YYYY-MM-DD'),
    'Nature of Work': e.natureOfWork || '',
    'Account': e.account || '',
    'Project / Work': e.projectWork || '',
    'Important Tasks / Features': e.importantTasksFeatures || '',
    'Tools / Technology / Skills': e.toolsTechSkills || '',
    'Priority': e.priority || 'NONE',
    'Remarks': e.remarks || '',
    'Attachments': e.attachments || '',
    'Row Color': e.rowColor || '',
  }));
}

export async function exportToExcel(): Promise<Buffer> {
  const entries = await getExportData();
  const rows = entriesToRows(entries);

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });

  sheet['!cols'] = [
    { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 22 },
    { wch: 30 }, { wch: 28 }, { wch: 10 }, { wch: 24 },
    { wch: 24 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(workbook, sheet, 'Worklog');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export async function exportToJson(): Promise<string> {
  const entries = await getExportData();
  const rows = entriesToRows(entries);
  return JSON.stringify({ worklog: rows }, null, 2);
}

export async function exportToCsv(): Promise<Buffer> {
  const entries = await getExportData();
  const rows = entriesToRows(entries);

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  XLSX.utils.book_append_sheet(workbook, sheet, 'Worklog');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'csv' }));
}

// ─── Import ──────────────────────────────────────────

interface ParsedEntry {
  date: string;
  natureOfWork: string | null;
  account: string | null;
  projectWork: string | null;
  importantTasksFeatures: string | null;
  toolsTechSkills: string | null;
  priority: string;
  remarks: string | null;
  attachments: string | null;
  rowColor: string | null;
}

function parseRows(rows: Record<string, unknown>[]): ParsedEntry[] {
  return rows
    .map((row) => {
      const dateRaw =
        row['Date'] || row['date'] || '';
      let parsedDate = dayjs(String(dateRaw));
      // Excel numeric date
      if (!parsedDate.isValid() && typeof dateRaw === 'number') {
        parsedDate = dayjs(new Date(Math.round((dateRaw - 25569) * 86400 * 1000)));
      }
      if (!parsedDate.isValid()) return null;

      const colorRaw = String(row['Row Color'] || row['rowColor'] || row['row_color'] || '').toLowerCase().trim();
      const rowColor = ['gold', 'green', 'red'].includes(colorRaw) ? colorRaw : null;

      const priorityRaw = String(row['Priority'] || row['priority'] || 'NONE').toUpperCase().trim();
      const priority = ['NONE', 'LOW', 'MEDIUM', 'HIGH'].includes(priorityRaw) ? priorityRaw : 'NONE';

      return {
        date: parsedDate.format('YYYY-MM-DD'),
        natureOfWork: String(row['Nature of Work'] || row['natureOfWork'] || '').trim() || null,
        account: String(row['Account'] || row['account'] || '').trim() || null,
        projectWork: String(row['Project / Work'] || row['projectWork'] || row['Project'] || row['project'] || '').trim() || null,
        importantTasksFeatures: String(row['Important Tasks / Features'] || row['importantTasksFeatures'] || row['Tasks'] || '').trim() || null,
        toolsTechSkills: String(row['Tools / Technology / Skills'] || row['toolsTechSkills'] || row['Tools'] || '').trim() || null,
        priority,
        remarks: String(row['Remarks'] || row['remarks'] || '').trim() || null,
        attachments: String(row['Attachments'] || row['attachments'] || '').trim() || null,
        rowColor,
      };
    })
    .filter(Boolean) as ParsedEntry[];
}

function parseExcel(buffer: Buffer): ParsedEntry[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return parseRows(rows);
}

function parseCsv(buffer: Buffer): ParsedEntry[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return parseRows(rows);
}

function parseJson(buffer: Buffer): ParsedEntry[] {
  const data = JSON.parse(buffer.toString('utf8'));
  const items: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : data.worklog || data.entries || data.items || [];
  return parseRows(items);
}

export async function importWorklog(
  buffer: Buffer,
  format: 'xlsx' | 'json' | 'csv',
): Promise<{ imported: number }> {
  let parsed: ParsedEntry[] = [];

  switch (format) {
    case 'xlsx':
      parsed = parseExcel(buffer);
      break;
    case 'json':
      parsed = parseJson(buffer);
      break;
    case 'csv':
      parsed = parseCsv(buffer);
      break;
  }

  if (parsed.length === 0) {
    throw new Error('No valid worklog entries found in the uploaded file');
  }

  for (const entry of parsed) {
    await db.worklogEntry.create({
      data: {
        date: new Date(entry.date),
        natureOfWork: entry.natureOfWork,
        account: entry.account,
        projectWork: entry.projectWork,
        importantTasksFeatures: entry.importantTasksFeatures,
        toolsTechSkills: entry.toolsTechSkills,
        priority: entry.priority,
        remarks: entry.remarks,
        attachments: entry.attachments,
        rowColor: entry.rowColor,
        sourceType: 'MANUAL',
      },
    });
  }

  return { imported: parsed.length };
}
