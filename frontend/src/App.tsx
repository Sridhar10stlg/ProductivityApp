import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './shared/components/AppLayout';
import { HomePage } from './pages/HomePage';
import { ExpenseDashboard } from './modules/expenses/pages/ExpenseDashboard';
import { ExpenseCalendarPage } from './modules/expenses/pages/ExpenseCalendarPage';
import { ExpenseAnalyticsPage } from './modules/expenses/pages/ExpenseAnalyticsPage';
import { BudgetPage } from './modules/expenses/pages/BudgetPage';
import { TodoPage } from './modules/todos/pages/TodoPage';
import { WorklogPage } from './modules/worklog/pages/WorklogPage';

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/expenses" element={<ExpenseDashboard />} />
        <Route path="/expenses/calendar" element={<ExpenseCalendarPage />} />
        <Route path="/expenses/analytics" element={<ExpenseAnalyticsPage />} />
        <Route path="/expenses/budgets" element={<BudgetPage />} />
        <Route path="/todos" element={<TodoPage />} />
        <Route path="/worklog" element={<WorklogPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
