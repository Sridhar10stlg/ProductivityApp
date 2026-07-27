import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Box, Typography } from '@mui/material';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface MonthlyBarChartProps {
  data: { month: number; expense: number; income: number; net: number }[];
  title?: string;
}

export function MonthlyBarChart({ data, title }: MonthlyBarChartProps) {
  const chartData = data.map((item) => ({
    name: MONTH_LABELS[item.month - 1],
    expense: item.expense,
    income: item.income,
  }));

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={(value) => `₹${value}`} />
          <Tooltip formatter={(value: number, name: string) => [`₹${value.toFixed(2)}`, name === 'expense' ? 'Expense' : 'Income']} />
          <Legend formatter={(value) => (value === 'expense' ? 'Expense' : 'Income')} />
          <Bar dataKey="expense" fill="#d32f2f" radius={[4, 4, 0, 0]} />
          <Bar dataKey="income" fill="#2e7d32" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}
