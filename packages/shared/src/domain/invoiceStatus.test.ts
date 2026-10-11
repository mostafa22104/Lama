import { describe, expect, it } from 'vitest';
import { computeInvoiceStatus } from './invoiceStatus.js';

const today = '2026-09-20';
const open = { paidAt: null, hasPendingClaim: false };

describe('computeInvoiceStatus', () => {
  it('is paid once paidAt is set, even with a pending claim or a past due date', () => {
    const input = { dueDate: '2026-09-01', paidAt: new Date(), hasPendingClaim: true };
    expect(computeInvoiceStatus(input, today)).toBe('paid');
  });

  it('is awaiting confirmation while a claim is pending, even if overdue', () => {
    const input = { dueDate: '2026-09-10', paidAt: null, hasPendingClaim: true };
    expect(computeInvoiceStatus(input, today)).toBe('awaiting_confirmation');
  });

  it('is overdue from the day after the due date', () => {
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-19' }, today)).toBe('overdue');
  });

  it('is due soon on the due date and up to 3 days before it', () => {
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-20' }, today)).toBe('due_soon');
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-23' }, today)).toBe('due_soon');
  });

  it('is upcoming more than 3 days before the due date', () => {
    expect(computeInvoiceStatus({ ...open, dueDate: '2026-09-24' }, today)).toBe('upcoming');
  });
});
