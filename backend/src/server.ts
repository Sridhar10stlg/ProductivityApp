import express from 'express';
import cors from 'cors';
import { errorHandler } from './shared/middleware/errorHandler';
import { transactionRoutes } from './modules/expenses/transaction.routes';
import { categoryRoutes } from './modules/expenses/category.routes';
import { accountRoutes } from './modules/expenses/account.routes';
import { importExportRoutes } from './modules/expenses/importExport.routes';
import { budgetRoutes } from './modules/expenses/budget.routes';
import { taskListRoutes } from './modules/todos/taskList.routes';
import { taskRoutes } from './modules/todos/task.routes';
import { todoImportExportRoutes } from './modules/todos/todoImportExport.routes';
import { worklogRoutes } from './modules/worklog/worklog.routes';
import { worklogImportExportRoutes } from './modules/worklog/worklogImportExport.routes';
import { streaksRoutes } from './modules/streaks/streaks.routes';
import { leetCodeRoutes } from './modules/streaks/leetcode.routes';
import { streaksImportExportRoutes } from './modules/streaks/streaksImportExport.routes';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// API Routes — Finance
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/data', importExportRoutes);

// API Routes — To-Do
app.use('/api/v1/lists', taskListRoutes);
app.use('/api/v1/tasks/data', todoImportExportRoutes);
app.use('/api/v1/tasks', taskRoutes);

// API Routes — Worklog
app.use('/api/v1/worklog/data', worklogImportExportRoutes);
app.use('/api/v1/worklog', worklogRoutes);

// API Routes — Streaks (/data and /leetcode before the base path)
app.use('/api/v1/streaks/data', streaksImportExportRoutes);
app.use('/api/v1/streaks/leetcode', leetCodeRoutes);
app.use('/api/v1/streaks', streaksRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
