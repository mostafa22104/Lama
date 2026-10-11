import { describe, expect, it } from 'vitest';
import { daysBetween, dueDateInPeriod, periodOf, toBusinessDate } from './dates.js';

describe('toBusinessDate', () => {
  it('uses the Cairo calendar day, not the UTC day (summer, UTC+3)', () => {
    expect(toBusinessDate(new Date('2026-09-20T22:30:00Z'))).toBe('2026-09-21');
    expect(toBusinessDate(new Date('2026-09-20T20:30:00Z'))).toBe('2026-09-20');
  });

  it('uses the Cairo calendar day in winter (UTC+2)', () => {
    expect(toBusinessDate(new Date('2026-01-15T22:30:00Z'))).toBe('2026-01-16');
    expect(toBusinessDate(new Date('2026-01-15T21:30:00Z'))).toBe('2026-01-15');
  });
});

describe('daysBetween', () => {
  it('counts whole calendar days, negative when the target is earlier', () => {
    expect(daysBetween('2026-09-20', '2026-09-23')).toBe(3);
    expect(daysBetween('2026-09-20', '2026-09-20')).toBe(0);
    expect(daysBetween('2026-09-20', '2026-09-19')).toBe(-1);
    expect(daysBetween('2026-02-27', '2026-03-02')).toBe(3);
  });
});

describe('periodOf', () => {
  it('returns YYYY-MM', () => {
    expect(periodOf('2026-09-20')).toBe('2026-09');
  });
});

describe('dueDateInPeriod', () => {
  it('builds the due date for a day of the month', () => {
    expect(dueDateInPeriod('2026-09', 20)).toBe('2026-09-20');
    expect(dueDateInPeriod('2026-09', 5)).toBe('2026-09-05');
  });

  it('clamps to the last day of short months', () => {
    expect(dueDateInPeriod('2026-02', 31)).toBe('2026-02-28');
    expect(dueDateInPeriod('2026-04', 31)).toBe('2026-04-30');
  });
});
