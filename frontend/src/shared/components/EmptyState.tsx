import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ message, actionLabel, onAction, icon }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        color: 'text.secondary',
      }}
    >
      {icon || <InboxIcon sx={{ fontSize: 64, mb: 2, opacity: 0.4 }} />}
      <Typography variant="body1" sx={{ mb: 2 }}>
        {message}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="outlined" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
