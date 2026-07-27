import dayjs from 'dayjs';

export function getMonthRange(year: number, month: number) {
  const start = dayjs()
    .year(year)
    .month(month - 1)
    .startOf('month')
    .toDate();
  const end = dayjs()
    .year(year)
    .month(month - 1)
    .endOf('month')
    .toDate();
  return { start, end };
}

export function getYearRange(year: number) {
  const start = dayjs().year(year).startOf('year').toDate();
  const end = dayjs().year(year).endOf('year').toDate();
  return { start, end };
}
