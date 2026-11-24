import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './shared/components/AppLayout';
import { HomePage } from './pages/HomePage';
import { ExpenseDashboard } from './modules/expenses/pages/ExpenseDashboard';
import { ExpenseCalendarPage } from './modules/expenses/pages/ExpenseCalendarPage';
import { ExpenseAnalyticsPage } from './modules/expenses/pages/ExpenseAnalyticsPage';
import { BudgetPage } from './modules/expenses/pages/BudgetPage';
import { TodoPage } from './modules/todos/pages/TodoPage';
import { WorklogPage } from './modules/worklog/pages/WorklogPage';
import { StreaksTodayPage } from './modules/streaks/pages/StreaksTodayPage';
import { StreaksTrackerPage } from './modules/streaks/pages/StreaksTrackerPage';
import { StreaksWeeklyPage } from './modules/streaks/pages/StreaksWeeklyPage';
import { HabitDetailPage } from './modules/streaks/pages/HabitDetailPage';
import { LeetCodePage } from './modules/streaks/pages/LeetCodePage';
import { StreaksSettingsPage } from './modules/streaks/pages/StreaksSettingsPage';

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
        <Route path="/streaks" element={<StreaksTodayPage />} />
        <Route path="/streaks/tracker" element={<StreaksTrackerPage />} />
        <Route path="/streaks/weekly" element={<StreaksWeeklyPage />} />
        <Route path="/streaks/habit/:id" element={<HabitDetailPage />} />
        <Route path="/streaks/leetcode" element={<LeetCodePage />} />
        <Route path="/streaks/settings" element={<StreaksSettingsPage />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
