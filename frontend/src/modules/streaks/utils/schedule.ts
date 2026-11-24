import dayjs from 'dayjs';

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Is a weekday-scheduled habit scheduled on this date? (null = every day)
export const scheduledOn = (habit: { weekdays: number[] | null }, date: string) =>
  !habit.weekdays || habit.weekdays.includes(dayjs(date).day());

export function scheduleLabel(weekdays: number[] | null, weeklyTarget: number | null = null): string {
  if (weeklyTarget) return `${weeklyTarget} day${weeklyTarget === 1 ? '' : 's'} a week`;
  if (!weekdays) return 'every day';
  const days = [...weekdays].sort();
  if (days.join() === '1,2,3,4,5') return 'Mon to Fri';
  if (days.join() === '0,6') return 'weekends';
  return days.map((d) => WEEKDAY_SHORT[d]).join(', ');
}
