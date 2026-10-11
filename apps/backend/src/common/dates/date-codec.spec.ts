import { describe, expect, it } from 'vitest';
import { businessToday, fromIsoDate, isValidIsoDate, toIsoDate } from './date-codec.js';

describe('date codec', () => {
  it('round-trips calendar dates through UTC midnight', () => {
    expect(fromIsoDate('2026-09-20').toISOString()).toBe('2026-09-20T00:00:00.000Z');
    expect(toIsoDate(new Date('2026-09-20T00:00:00.000Z'))).toBe('2026-09-20');
  });

  it('rejects impossible dates', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('20-09-2026')).toBe(false);
  });

  it('uses the Cairo day for today', () => {
    expect(businessToday(new Date('2026-09-22T22:30:00Z'))).toBe('2026-09-23');
  });
});
