import type { InvoiceStatus } from './invoiceStatus.js';

const OPEN_PRIORITY: InvoiceStatus[] = ['overdue', 'awaiting_confirmation', 'due_soon', 'upcoming'];

/** Lower is more urgent. Paid sorts after every open status. */
export function statusPriority(status: InvoiceStatus): number {
  const index = OPEN_PRIORITY.indexOf(status);
  return index === -1 ? OPEN_PRIORITY.length : index;
}

/** The status shown on a customer row: the most urgent open invoice, else paid, else none. */
export function summarizeCustomerStatus(
  openStatuses: InvoiceStatus[],
  hasInvoices: boolean,
): InvoiceStatus | null {
  if (openStatuses.length === 0) return hasInvoices ? 'paid' : null;
  return [...openStatuses].sort((a, b) => statusPriority(a) - statusPriority(b))[0];
}
