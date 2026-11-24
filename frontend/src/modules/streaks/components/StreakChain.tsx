import { Box, Tooltip } from '@mui/material';
import dayjs from 'dayjs';
import type { ChainState, HabitChainState } from '../types/streaks.types';

type State = ChainState | HabitChainState;

const STATE_STYLES: Record<State, { bg: string; border?: string; label: string }> = {
  PRODUCTIVE: { bg: '#2e7d32', label: 'Productive' },
  PLAN_C_OK: { bg: '#0288d1', label: 'Plan C ok' },
  NOT_YET: { bg: '#ed6c02', label: 'Not yet' },
  DONE: { bg: '#2e7d32', label: 'Done' },
  NA: { bg: '#b0bec5', label: 'Not applicable' },
  MISSED: { bg: '#ef9a9a', label: 'Missed' },
  OPEN: { bg: 'transparent', border: '#90a4ae', label: 'Today (still open)' },
  INACTIVE: { bg: '#eceff1', label: 'Not active yet' },
};

interface StreakChainProps {
  chain: { date: string; state: State }[];
  size?: number;
}

// A row of dots, oldest to newest: the "chain" you try not to break.
export function StreakChain({ chain, size = 14 }: StreakChainProps) {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
      {chain.map(({ date, state }) => {
        const style = STATE_STYLES[state];
        return (
          <Tooltip key={date} title={`${dayjs(date).format('ddd D MMM')}: ${style.label}`} arrow>
            <Box
              sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                bgcolor: style.bg,
                border: style.border ? `2px dashed ${style.border}` : 'none',
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}
