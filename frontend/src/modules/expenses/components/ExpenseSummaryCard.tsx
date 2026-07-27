import { Card, CardContent, Typography, Box } from '@mui/material';
import React from 'react';

interface ExpenseSummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  color?: string;
}

export function ExpenseSummaryCard({ title, amount, icon, color = '#1976d2' }: ExpenseSummaryCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}15`,
              color,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              ₹{amount.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
