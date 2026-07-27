import * as XLSX from 'xlsx';
import prisma from '../../shared/db/prisma';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

// ─── Types ──────────────────────────────────────────

interface ParsedTask {
  title: string;
  completed: boolean;
  important: boolean;
  dueDate: string | null;
  subtasks: { title: string; completed: boolean }[];
}

interface ImportResult {
  tasksImported: number;
  subtasksImported: number;
  listName: string;
}

// ─── PDF Parsing (Microsoft To Do print format) ─────
// Text structure from pdf-parse v1:
//   "K\n<task title>" = active task
//   "O\n<task title>" = completed task (in Completed section)
//   "ÿ\n<subtask title>" = completed subtask
//   "þ\n<subtask title>" = incomplete subtask
//   "Խ" = important star
//   "X of Y" = subtask count (skip)
//   "∙" = separator dot (skip)
//   Date lines: "Fri, 13Feb" or "Mon, 8Sep, 2025"

function parseMsToDoText(text: string): ParsedTask[] {
  const tasks: ParsedTask[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentTask: ParsedTask | null = null;
  let inCompleted = false;
  let expectTaskTitle = false;
  let expectSubtaskTitle: 'completed' | 'incomplete' | null = null;
  let lastMultiLinePart: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip page headers: "Tasks" alone or with date
    if (line === 'Tasks') continue;
    if (/^\d{1,2}\s+\w+\s+\d{4}$/.test(line)) continue; // "15 February 2026"

    // Skip page footers
    if (line.startsWith('Printed with Microsoft To Do')) continue;
    if (/^\d+\/\d+$/.test(line)) continue;

    // Detect "Completed" section header
    if (line === 'Completed') {
      if (currentTask) { tasks.push(currentTask); currentTask = null; }
      inCompleted = true;
      continue;
    }

    // If we're expecting a subtask title from previous ÿ or þ marker
    if (expectSubtaskTitle) {
      if (currentTask && line.length > 0) {
        currentTask.subtasks.push({
          title: line,
          completed: expectSubtaskTitle === 'completed',
        });
      }
      expectSubtaskTitle = null;
      continue;
    }

    // If we're expecting a task title from previous K or O marker
    if (expectTaskTitle) {
      // The next non-metadata line is the task title
      if (currentTask) { tasks.push(currentTask); }
      currentTask = {
        title: line,
        completed: inCompleted,
        important: false,
        dueDate: null,
        subtasks: [],
      };
      expectTaskTitle = false;
      lastMultiLinePart = line;
      continue;
    }

    // Task markers: K = active circle, O = completed circle
    if (line === 'K') {
      expectTaskTitle = true;
      continue;
    }
    if (line === 'O') {
      expectTaskTitle = true;
      continue;
    }

    // Subtask markers
    if (line === 'ÿ') { expectSubtaskTitle = 'completed'; continue; }
    if (line === 'þ') { expectSubtaskTitle = 'incomplete'; continue; }

    // Important marker
    if (line === 'Խ' || line === '★') {
      if (currentTask) currentTask.important = true;
      continue;
    }

    // Skip metadata
    if (line === 'Note') continue;
    if (line === '∙') continue;
    if (/^\d+\s+of\s+\d+$/.test(line)) continue;

    // Date lines: "Fri, 13Feb" or "Mon, 8Sep, 2025" or "Thu, 12Feb"
    // Also handles "Sun, 1Feb" "Sat, 24Jan" "Wed, 28Jan" etc.
    const dateMatch = line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*\d{1,2}\s*\w+/i);
    if (dateMatch) {
      if (currentTask) {
        currentTask.dueDate = parseDueDateStr(line);
      }
      continue;
    }

    // Multi-line task title continuation (e.g., title wrapping across lines)
    // If the previous line set a task and this line doesn't match any pattern,
    // it might be a continuation of the title
    if (currentTask && lastMultiLinePart && !line.match(/^[KO]$/) && line.length > 0) {
      // Check if this looks like continuation (not a marker, not a date, etc.)
      // Only if there's no clear pattern match
      const looksLikeContinuation = !line.match(/^(ÿ|þ|Խ|★|∙|Note|Completed|Tasks)$/) &&
        !line.match(/^\d+\s+of\s+\d+$/) &&
        !line.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),/i) &&
        !line.match(/^\d{1,2}\s+\w+\s+\d{4}$/) &&
        !line.startsWith('Printed with');

      if (looksLikeContinuation) {
        // Append to current task title
        currentTask.title += ' ' + line;
        lastMultiLinePart = null; // Only allow one continuation
        continue;
      }
    }

    lastMultiLinePart = null;
  }

  // Push last task
  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}

function parseDueDateStr(dateStr: string): string | null {
  const cleaned = dateStr.replace(/[☼🔄Խ★]/g, '').trim();

  const formats = [
    'ddd, D MMM, YYYY', 'ddd, D MMM YYYY', 'ddd, D MMM',
    'ddd, DD MMM, YYYY', 'ddd, DD MMM YYYY', 'ddd, DD MMM',
    'D MMM, YYYY', 'D MMM YYYY', 'D MMM',
  ];

  // Try as-is
  for (const fmt of formats) {
    const parsed = dayjs(cleaned, fmt);
    if (parsed.isValid()) {
      if (!cleaned.match(/\d{4}/)) return parsed.year(2025).format('YYYY-MM-DD');
      return parsed.format('YYYY-MM-DD');
    }
  }

  // PDF text often has no space between day and month: "13Feb" -> "13 Feb"
  const fixed = cleaned.replace(
    /(\d{1,2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/gi,
    '$1 $2',
  );
  for (const fmt of formats) {
    const parsed = dayjs(fixed, fmt);
    if (parsed.isValid()) {
      if (!fixed.match(/\d{4}/)) return parsed.year(2025).format('YYYY-MM-DD');
      return parsed.format('YYYY-MM-DD');
    }
  }

  return null;
}

// ─── Excel Parsing ──────────────────────────────────

function parseExcelTasks(buffer: Buffer): ParsedTask[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rows.map((row) => ({
    title: String(row['Title'] || row['title'] || row['Task'] || row['task'] || ''),
    completed: Boolean(row['Completed'] || row['completed'] || row['Done'] || row['done']),
    important: Boolean(row['Important'] || row['important'] || row['Starred'] || row['starred']),
    dueDate: row['Due Date'] || row['dueDate'] || row['due_date']
      ? String(row['Due Date'] || row['dueDate'] || row['due_date'])
      : null,
    subtasks: [],
  })).filter((t) => t.title.trim().length > 0);
}

// ─── JSON Parsing ───────────────────────────────────

function parseJsonTasks(buffer: Buffer): ParsedTask[] {
  const data = JSON.parse(buffer.toString('utf8'));
  const items = Array.isArray(data) ? data : data.tasks || data.items || [];

  return items.map((item: Record<string, unknown>) => ({
    title: String(item.title || ''),
    completed: Boolean(item.completed),
    important: Boolean(item.important),
    dueDate: item.dueDate ? String(item.dueDate) : null,
    subtasks: Array.isArray(item.subtasks)
      ? item.subtasks.map((s: Record<string, unknown>) => ({
          title: String(s.title || ''),
          completed: Boolean(s.completed),
        }))
      : [],
  })).filter((t: ParsedTask) => t.title.trim().length > 0);
}

// ─── CSV Parsing ────────────────────────────────────

function parseCsvTasks(buffer: Buffer): ParsedTask[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', raw: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  return rows.map((row) => ({
    title: String(row['Title'] || row['title'] || row['Task'] || row['task'] || ''),
    completed: String(row['Completed'] || row['completed'] || row['Done'] || row['done'] || 'false').toLowerCase() === 'true',
    important: String(row['Important'] || row['important'] || 'false').toLowerCase() === 'true',
    dueDate: row['Due Date'] || row['dueDate']
      ? String(row['Due Date'] || row['dueDate'])
      : null,
    subtasks: [],
  })).filter((t) => t.title.trim().length > 0);
}

// ─── Import ─────────────────────────────────────────

export async function importTasks(
  buffer: Buffer,
  format: 'pdf' | 'xlsx' | 'json' | 'csv',
  listId?: number,
  listName?: string,
): Promise<ImportResult> {
  let parsed: ParsedTask[] = [];

  switch (format) {
    case 'pdf': {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
      const pdfData = await pdfParse(buffer);
      parsed = parseMsToDoText(pdfData.text);
      break;
    }
    case 'xlsx':
      parsed = parseExcelTasks(buffer);
      break;
    case 'json':
      parsed = parseJsonTasks(buffer);
      break;
    case 'csv':
      parsed = parseCsvTasks(buffer);
      break;
  }

  if (parsed.length === 0) {
    throw new Error('No tasks found in the uploaded file');
  }

  // Determine target list
  let targetListId: number;
  const targetListName = listName || 'Imported Tasks';

  if (listId) {
    targetListId = listId;
  } else {
    const newList = await prisma.taskList.create({
      data: { name: targetListName, icon: 'FileDownload', color: '#1976d2' },
    });
    targetListId = newList.id;
  }

  let tasksImported = 0;
  let subtasksImported = 0;

  for (const task of parsed) {
    const created = await prisma.task.create({
      data: {
        title: task.title,
        completed: task.completed,
        completedAt: task.completed ? new Date() : null,
        important: task.important,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        listId: targetListId,
        priority: 'NONE',
        subtasks: {
          create: task.subtasks.map((s, idx) => ({
            title: s.title,
            completed: s.completed,
            sortOrder: idx,
          })),
        },
      },
    });
    tasksImported++;
    subtasksImported += task.subtasks.length;
  }

  const list = await prisma.taskList.findUnique({ where: { id: targetListId } });

  return {
    tasksImported,
    subtasksImported,
    listName: list?.name || targetListName,
  };
}

// ─── Export ─────────────────────────────────────────

async function getExportData(listId?: number) {
  const where: Record<string, unknown> = {};
  if (listId) where.listId = listId;

  return prisma.task.findMany({
    where,
    include: {
      subtasks: { orderBy: { sortOrder: 'asc' } },
      list: true,
    },
    orderBy: [{ completed: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function exportToExcel(listId?: number): Promise<Buffer> {
  const tasks = await getExportData(listId);

  const rows: Record<string, unknown>[] = [];
  for (const task of tasks) {
    rows.push({
      'Title': task.title,
      'Completed': task.completed ? 'Yes' : 'No',
      'Important': task.important ? 'Yes' : 'No',
      'Priority': task.priority,
      'Due Date': task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : '',
      'List': task.list?.name || '',
      'Note': task.note || '',
      'Subtasks': task.subtasks.map((s) => `[${s.completed ? 'x' : ' '}] ${s.title}`).join('; '),
      'Created': dayjs(task.createdAt).format('YYYY-MM-DD HH:mm'),
    });
  }

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 50 }, { wch: 10 }, { wch: 10 }, { wch: 8 },
    { wch: 12 }, { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tasks');

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export async function exportToJson(listId?: number): Promise<string> {
  const tasks = await getExportData(listId);

  const exportData = tasks.map((task) => ({
    title: task.title,
    completed: task.completed,
    important: task.important,
    priority: task.priority,
    dueDate: task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : null,
    list: task.list?.name || '',
    note: task.note,
    subtasks: task.subtasks.map((s) => ({
      title: s.title,
      completed: s.completed,
    })),
    createdAt: dayjs(task.createdAt).format('YYYY-MM-DD HH:mm'),
  }));

  return JSON.stringify({ tasks: exportData }, null, 2);
}

export async function exportToCsv(listId?: number): Promise<Buffer> {
  const tasks = await getExportData(listId);

  const rows = tasks.map((task) => ({
    'Title': task.title,
    'Completed': task.completed,
    'Important': task.important,
    'Priority': task.priority,
    'Due Date': task.dueDate ? dayjs(task.dueDate).format('YYYY-MM-DD') : '',
    'List': task.list?.name || '',
    'Note': task.note || '',
    'Subtasks': task.subtasks.map((s) => `[${s.completed ? 'x' : ' '}] ${s.title}`).join('; '),
    'Created': dayjs(task.createdAt).format('YYYY-MM-DD HH:mm'),
  }));

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Tasks');

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'csv' }));
}
