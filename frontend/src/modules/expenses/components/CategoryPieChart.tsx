import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Typography } from '@mui/material';
import type { CategoryBreakdownItem } from '../types/expense.types';

interface CategoryPieChartProps {
  data: CategoryBreakdownItem[];
  title?: string;
}

export function CategoryPieChart({ data, title }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="categoryName"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload as CategoryBreakdownItem;
              return (
                <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, boxShadow: 2 }}>
                  <Typography variant="body2" fontWeight={700}>{item.categoryName}</Typography>
                  <Typography variant="body2">₹{item.total.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.percentage}%</Typography>
                </Box>
              );
            }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => <span style={{ fontSize: '0.75rem' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
