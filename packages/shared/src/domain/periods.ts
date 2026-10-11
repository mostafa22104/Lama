import { resources } from '../i18n/index.js';
import type { Locale } from '../types/locale.js';
import { dueDateInPeriod, type IsoDate } from './dates.js';

function split(period: string): [number, number] {
  const [year, month] = period.split('-').map(Number);
  return [year, month];
}

function format(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function nextPeriod(period: string): string {
  const [year, month] = split(period);
  return month === 12 ? format(year + 1, 1) : format(year, month + 1);
}

export function previousPeriod(period: string): string {
  const [year, month] = split(period);
  return month === 1 ? format(year - 1, 12) : format(year, month - 1);
}

/** Periods from `from` to `to`, inclusive; empty when `from` is after `to`. */
export function periodsBetween(from: string, to: string): string[] {
  const periods: string[] = [];
  for (let period = from; period <= to; period = nextPeriod(period)) periods.push(period);
  return periods;
}

export function periodRange(period: string): { start: IsoDate; end: IsoDate } {
  return { start: `${period}-01`, end: dueDateInPeriod(period, 31) };
}

export function monthName(period: string, locale: Locale): string {
  return resources[locale].common.months[Number(period.slice(5, 7)) - 1];
}
