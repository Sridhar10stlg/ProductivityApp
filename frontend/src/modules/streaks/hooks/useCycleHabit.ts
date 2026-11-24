import { useCallback } from 'react';
import { useSaveDayMutation } from '../store/streaksApi';
import type { DayScore, EntryStatus } from '../types/streaks.types';

// blank (missed) -> done -> not applicable -> blank, matching the spreadsheet's x / - / blank.
export function nextStatus(current: EntryStatus | undefined): EntryStatus | null {
  if (current === undefined) return 'DONE';
  if (current === 'DONE') return 'NA';
  return null;
}

export function useCycleHabit() {
  const [saveDay] = useSaveDayMutation();

  return useCallback(
    (day: DayScore, habitId: number) => {
      saveDay({ date: day.date, data: { entries: { [habitId]: nextStatus(day.entries[habitId]) } } });
    },
    [saveDay]
  );
}
