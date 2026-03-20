const DAY_MS = 1000 * 60 * 60 * 24;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DateKeyedValue = {
  date: Date;
  dateKey?: string;
};

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function formatDateKeyPart(value: number) {
  return String(value).padStart(2, '0');
}

function startOfDayValue(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return Math.floor(copy.getTime() / DAY_MS);
}

function dateKeyDayValue(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

export function isValidDateKey(dateKey: string | undefined): dateKey is string {
  return Boolean(dateKey && DATE_KEY_PATTERN.test(dateKey));
}

export function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${formatDateKeyPart(date.getMonth() + 1)}-${formatDateKeyPart(
    date.getDate()
  )}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const next = parseDateKey(dateKey);
  next.setUTCDate(next.getUTCDate() + days);
  return `${next.getUTCFullYear()}-${formatDateKeyPart(next.getUTCMonth() + 1)}-${formatDateKeyPart(
    next.getUTCDate()
  )}`;
}

export function getDateKeyedDayValue(value: DateKeyedValue) {
  if (isValidDateKey(value.dateKey)) {
    return dateKeyDayValue(value.dateKey);
  }
  return startOfDayValue(value.date);
}

export function getReferenceDayValue(referenceDate: Date, referenceDateKey?: string) {
  if (isValidDateKey(referenceDateKey)) {
    return dateKeyDayValue(referenceDateKey);
  }
  return startOfDayValue(referenceDate);
}

export function formatDateKeyedShortDate(value: DateKeyedValue) {
  if (isValidDateKey(value.dateKey)) {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    }).format(parseDateKey(value.dateKey));
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(value.date);
}

export function getUpcomingDateKeyedItems<T extends DateKeyedValue>(
  items: T[],
  referenceDate: Date,
  options: {
    referenceDateKey?: string;
    daysAhead?: number;
    limit?: number;
  } = {}
) {
  const daysAhead = options.daysAhead ?? 45;
  const limit = options.limit ?? 5;
  const windowStart = getReferenceDayValue(referenceDate, options.referenceDateKey);
  const windowEnd = windowStart + daysAhead;

  const futureItems = [...items]
    .filter((item) => getDateKeyedDayValue(item) >= windowStart)
    .sort((left, right) => {
      const leftDay = getDateKeyedDayValue(left);
      const rightDay = getDateKeyedDayValue(right);
      if (leftDay !== rightDay) return leftDay - rightDay;
      return left.date.getTime() - right.date.getTime();
    });

  const inWindow = futureItems.filter((item) => getDateKeyedDayValue(item) <= windowEnd);
  return (inWindow.length > 0 ? inWindow : futureItems).slice(0, limit);
}
