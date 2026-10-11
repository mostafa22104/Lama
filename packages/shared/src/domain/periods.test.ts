import { describe, expect, it } from 'vitest';
import { monthName, nextPeriod, periodRange, periodsBetween, previousPeriod } from './periods.js';

describe('periods', () => {
  it('steps across year boundaries', () => {
    expect(nextPeriod('2026-09')).toBe('2026-10');
    expect(nextPeriod('2026-12')).toBe('2027-01');
    expect(previousPeriod('2027-01')).toBe('2026-12');
    expect(previousPeriod('2026-10')).toBe('2026-09');
  });

  it('lists periods inclusively, empty when reversed', () => {
    expect(periodsBetween('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02']);
    expect(periodsBetween('2026-09', '2026-09')).toEqual(['2026-09']);
    expect(periodsBetween('2026-10', '2026-09')).toEqual([]);
  });

  it('gives the first and last calendar day of a month', () => {
    expect(periodRange('2027-02')).toEqual({ start: '2027-02-01', end: '2027-02-28' });
    expect(periodRange('2026-09')).toEqual({ start: '2026-09-01', end: '2026-09-30' });
  });

  it('names months in both languages', () => {
    expect(monthName('2026-09', 'ar')).toBe('سبتمبر');
    expect(monthName('2026-01', 'en')).toBe('January');
  });
});
