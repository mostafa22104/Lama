import { daysBetween, type IsoDate } from './dates.js';

export const INVOICE_STATUSES = [
  'paid',
  'awaiting_confirmation',
  'overdue',
  'due_soon',
  'upcoming',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const DUE_SOON_DAYS = 3;

export interface InvoiceStatusInput {
  dueDate: IsoDate;
  paidAt: Date | string | null;
  hasPendingClaim: boolean;
}

export function computeInvoiceStatus(input: InvoiceStatusInput, today: IsoDate): InvoiceStatus {
  if (input.paidAt) return 'paid';
  if (input.hasPendingClaim) return 'awaiting_confirmation';

  const daysLeft = daysBetween(today, input.dueDate);
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= DUE_SOON_DAYS) return 'due_soon';
  return 'upcoming';
}
