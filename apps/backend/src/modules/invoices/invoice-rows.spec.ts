import { describe, expect, it } from 'vitest';
import { buildInvoiceRows } from './invoice-rows.js';

const monthly = { kind: 'monthly' as const, title: 'اشتراك', amount: 450, dayOfMonth: 31, dueDate: null };

describe('buildInvoiceRows', () => {
  it('creates one row per customer per period, clamping the due day', () => {
    const rows = buildInvoiceRows(monthly, ['c1', 'c2'], ['2027-01', '2027-02']);
    expect(rows.map((r) => [r.customerId, r.period, r.dueDate.toISOString().slice(0, 10)])).toEqual([
      ['c1', '2027-01', '2027-01-31'],
      ['c2', '2027-01', '2027-01-31'],
      ['c1', '2027-02', '2027-02-28'],
      ['c2', '2027-02', '2027-02-28'],
    ]);
    expect(new Set(rows.map((r) => r.publicToken)).size).toBe(4);
  });

  it('creates one period-less row per customer for one-time charges', () => {
    const oneTime = { kind: 'one_time' as const, title: 'تيشيرت', amount: 150, dayOfMonth: null, dueDate: '2026-09-23' };
    const rows = buildInvoiceRows(oneTime, ['c1'], ['2026-09', '2026-10']);
    expect(rows).toEqual([
      expect.objectContaining({ customerId: 'c1', period: null, title: 'تيشيرت', amount: 150 }),
    ]);
    expect(rows[0].dueDate.toISOString()).toBe('2026-09-23T00:00:00.000Z');
  });
});
