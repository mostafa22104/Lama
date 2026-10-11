export const BUSINESS_TIME_ZONE = 'Africa/Cairo';

/** Calendar date in "YYYY-MM-DD" form. */
export type IsoDate = string;

const MS_PER_DAY = 86_400_000;

export function toBusinessDate(instant: Date, timeZone: string = BUSINESS_TIME_ZONE): IsoDate {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const diff = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(diff / MS_PER_DAY);
}

export function periodOf(date: IsoDate): string {
  return date.slice(0, 7);
}

export function dueDateInPeriod(period: string, dayOfMonth: number): IsoDate {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${period}-${String(day).padStart(2, '0')}`;
}
