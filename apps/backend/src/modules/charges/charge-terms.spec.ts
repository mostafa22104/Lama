import { describe, expect, it } from 'vitest';
import { toChargeTerms } from './charge-terms.js';

const fieldErr = (field: string, constraint: string) =>
  expect.objectContaining({ code: 'VALIDATION_FAILED', details: [{ field, constraints: [constraint] }] });

describe('toChargeTerms', () => {
  it('defaults the monthly title', () => {
    expect(toChargeTerms({ kind: 'monthly', amount: 450, dayOfMonth: 20, assignTo: 'all' })).toEqual({
      kind: 'monthly',
      title: 'اشتراك',
      amount: 450,
      dayOfMonth: 20,
      dueDate: null,
    });
  });

  it('requires a day for monthly charges', () => {
    expect(() => toChargeTerms({ kind: 'monthly', amount: 450, assignTo: 'all' })).toThrow(fieldErr('dayOfMonth', 'required'));
  });

  it('requires a title and a real due date for one-time charges', () => {
    const base = { kind: 'one_time' as const, amount: 1200, assignTo: 'all' as const };
    expect(() => toChargeTerms({ ...base, dueDate: '2026-10-01' })).toThrow(fieldErr('title', 'required'));
    expect(() => toChargeTerms({ ...base, title: 'كامب' })).toThrow(fieldErr('dueDate', 'required'));
    expect(() => toChargeTerms({ ...base, title: 'كامب', dueDate: '2026-02-30' })).toThrow(fieldErr('dueDate', 'invalidDate'));
    expect(toChargeTerms({ ...base, title: 'كامب الصيف', dueDate: '2026-10-01' })).toEqual({
      kind: 'one_time',
      title: 'كامب الصيف',
      amount: 1200,
      dayOfMonth: null,
      dueDate: '2026-10-01',
    });
  });
});
