import { useState, useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';

export function useCalendarNavigation() {
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());

  const year = currentDate.year();
  const month = currentDate.month() + 1;

  const goToPrevMonth = useCallback(() => {
    setCurrentDate((d) => d.subtract(1, 'month'));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate((d) => d.add(1, 'month'));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(dayjs());
  }, []);

  return { year, month, currentDate, goToPrevMonth, goToNextMonth, goToToday };
}
