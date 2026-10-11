import { describe, expect, it } from 'vitest';
import { buildHistory, type HistorySource } from './customer-history.js';

const source: HistorySource = {
  createdAt: new Date('2026-07-01T08:00:00.000Z'),
  invoices: [
    {
      id: 'sep', title: 'اشتراك', period: '2026-09', amount: 450,
      dueDate: new Date('2026-09-20T00:00:00.000Z'), paidAt: null, _count: { claims: 0 },
      payments: [],
      reminderLogs: [{ kind: 'before', sentAt: new Date('2026-09-17T07:00:00.000Z') }],
    },
    {
      id: 'aug', title: 'اشتراك', period: '2026-08', amount: 450,
      dueDate: new Date('2026-08-20T00:00:00.000Z'), paidAt: new Date('2026-08-21T10:00:00.000Z'), _count: { claims: 0 },
      payments: [{ amount: 450, method: 'instapay', recordedAt: new Date('2026-08-21T10:00:00.000Z') }],
      reminderLogs: [],
    },
  ],
};

describe('buildHistory', () => {
  it('merges creation, invoices, payments and reminders newest first', () => {
    expect(buildHistory(source, '2026-09-23').map((e) => [e.type, e.at])).toEqual([
      ['invoice', '2026-09-20'],
      ['reminder', '2026-09-17T07:00:00.000Z'],
      ['payment', '2026-08-21T10:00:00.000Z'],
      ['invoice', '2026-08-20'],
      ['created', '2026-07-01T08:00:00.000Z'],
    ]);
  });

  it('carries computed status and payment method', () => {
    const events = buildHistory(source, '2026-09-23');
    expect(events[0]).toMatchObject({ type: 'invoice', invoiceId: 'sep', status: 'overdue', period: '2026-09' });
    expect(events[2]).toMatchObject({ type: 'payment', method: 'instapay', amount: 450 });
  });
});
