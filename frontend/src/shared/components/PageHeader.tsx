import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  onAction?: () => void;
}

export function PageHeader({ title, subtitle, actionLabel, actionIcon, onAction }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actionLabel && onAction && (
        <Button variant="contained" startIcon={actionIcon} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
