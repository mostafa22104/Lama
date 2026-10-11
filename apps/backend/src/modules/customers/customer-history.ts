import { computeInvoiceStatus, type HistoryEventDto, type IsoDate, type ReminderKind } from '@lamma/shared';
import { toIsoDate } from '../../common/dates/date-codec.js';

export interface HistorySource {
  createdAt: Date;
  invoices: {
    id: string;
    title: string;
    period: string | null;
    amount: number;
    dueDate: Date;
    paidAt: Date | null;
    _count: { claims: number };
    payments: { amount: number; method: 'instapay' | 'cash'; recordedAt: Date }[];
    reminderLogs: { kind: ReminderKind; sentAt: Date }[];
  }[];
}

export function buildHistory(source: HistorySource, today: IsoDate): HistoryEventDto[] {
  const events: HistoryEventDto[] = [{ type: 'created', at: source.createdAt.toISOString() }];
  for (const invoice of source.invoices) {
    const dueDate = toIsoDate(invoice.dueDate);
    const base = { invoiceId: invoice.id, title: invoice.title, period: invoice.period };
    const status = computeInvoiceStatus(
      { dueDate, paidAt: invoice.paidAt, hasPendingClaim: invoice._count.claims > 0 },
      today,
    );
    events.push({ type: 'invoice', at: dueDate, ...base, amount: invoice.amount, status });
    for (const payment of invoice.payments) {
      events.push({ type: 'payment', at: payment.recordedAt.toISOString(), ...base, amount: payment.amount, method: payment.method });
    }
    for (const log of invoice.reminderLogs) {
      events.push({ type: 'reminder', at: log.sentAt.toISOString(), invoiceId: invoice.id, kind: log.kind });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at));
}
