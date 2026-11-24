import { Chip, alpha } from '@mui/material';
import { RESULT_COLORS, RESULT_LABELS } from '../types/streaks.types';
import type { DayResult } from '../types/streaks.types';

interface ResultChipProps {
  result: DayResult | null;
  size?: 'small' | 'medium';
}

export function ResultChip({ result, size = 'small' }: ResultChipProps) {
  if (!result) {
    return <Chip label="Not logged" size={size} variant="outlined" sx={{ color: 'text.secondary' }} />;
  }
  const color = RESULT_COLORS[result];
  return (
    <Chip
      label={RESULT_LABELS[result]}
      size={size}
      sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 700 }}
    />
  );
}
