import {
  type CustomerDto,
  type CustomerListItemDto,
  type InvoiceSummaryDto,
  statusPriority,
  summarizeCustomerStatus,
} from '@lamma/shared';

export function byUrgency(a: InvoiceSummaryDto, b: InvoiceSummaryDto): number {
  return statusPriority(a.status) - statusPriority(b.status) || a.dueDate.localeCompare(b.dueDate);
}

export function buildCustomerListItem(
  customer: CustomerDto,
  open: InvoiceSummaryDto[],
  hasInvoices: boolean,
): CustomerListItemDto {
  return {
    ...customer,
    balance: open.reduce((sum, invoice) => sum + invoice.amount, 0),
    status: summarizeCustomerStatus(open.map((invoice) => invoice.status), hasInvoices),
    headline: [...open].sort(byUrgency)[0] ?? null,
  };
}
