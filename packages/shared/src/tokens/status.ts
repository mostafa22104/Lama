import type { InvoiceStatus } from '../domain/invoiceStatus.js';
import type { StatusKey } from './theme.js';

const KEY_BY_STATUS: Record<InvoiceStatus, StatusKey | null> = {
  paid: 'paid',
  due_soon: 'dueSoon',
  overdue: 'overdue',
  awaiting_confirmation: 'awaiting',
  upcoming: null,
};

export function statusKeyFor(status: InvoiceStatus): StatusKey | null {
  return KEY_BY_STATUS[status];
}
