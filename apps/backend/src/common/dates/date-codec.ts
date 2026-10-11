import { type IsoDate, toBusinessDate } from '@lamma/shared';

/** Prisma maps @db.Date columns to Dates at UTC midnight. */
export function fromIsoDate(iso: IsoDate): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = fromIsoDate(value);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === value;
}

export function businessToday(now: Date): IsoDate {
  return toBusinessDate(now);
}
