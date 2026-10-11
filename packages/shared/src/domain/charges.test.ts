import { describe, expect, it } from 'vitest';
import { DEFAULT_MONTHLY_TITLE, invoiceDisplayTitle, nextMonthlyDue } from './charges.js';

describe('invoiceDisplayTitle', () => {
  it('appends the month name for monthly invoices', () => {
    expect(invoiceDisplayTitle({ title: DEFAULT_MONTHLY_TITLE, period: '2026-09' }, 'ar')).toBe('اشتراك سبتمبر');
    expect(invoiceDisplayTitle({ title: 'كامب الصيف', period: null }, 'ar')).toBe('كامب الصيف');
  });
});

describe('nextMonthlyDue', () => {
  it('uses next month once this month\'s due day has passed', () => {
    expect(nextMonthlyDue([{ amount: 450, dayOfMonth: 20 }], '2026-09-23')).toEqual({
      dueDate: '2026-10-20',
      amount: 450,
    });
  });

  it('uses this month while the due day is still ahead', () => {
    expect(nextMonthlyDue([{ amount: 450, dayOfMonth: 26 }], '2026-09-23')).toEqual({
      dueDate: '2026-09-26',
      amount: 450,
    });
  });

  it('picks the earliest date and sums charges due that day', () => {
    const charges = [
      { amount: 450, dayOfMonth: 5 },
      { amount: 100, dayOfMonth: 5 },
      { amount: 900, dayOfMonth: 25 },
    ];
    expect(nextMonthlyDue(charges, '2026-09-10')).toEqual({ dueDate: '2026-09-25', amount: 900 });
    expect(nextMonthlyDue(charges, '2026-09-28')).toEqual({ dueDate: '2026-10-05', amount: 550 });
  });

  it('is null without monthly charges', () => {
    expect(nextMonthlyDue([], '2026-09-23')).toBeNull();
  });
});
