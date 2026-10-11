import { computeInvoiceStatus, type InvoiceSummaryDto, type IsoDate } from '@lamma/shared';
import { toIsoDate } from '../../common/dates/date-codec.js';
import type { Prisma } from '../../generated/prisma/client.js';

export const INVOICE_SELECT = {
  id: true,
  chargeId: true,
  customerId: true,
  title: true,
  period: true,
  amount: true,
  dueDate: true,
  paidAt: true,
  publicToken: true,
  promisedDate: true,
  customer: { select: { id: true, name: true, phone: true, gender: true } },
  _count: { select: { claims: { where: { status: 'pending' } } } },
} satisfies Prisma.InvoiceSelect;

export type InvoiceRecord = Prisma.InvoiceGetPayload<{ select: typeof INVOICE_SELECT }>;

export interface OpenInvoice {
  summary: InvoiceSummaryDto;
  customer: InvoiceRecord['customer'];
  promisedDate: IsoDate | null;
}

export function toInvoiceSummary(record: InvoiceRecord, today: IsoDate): InvoiceSummaryDto {
  const dueDate = toIsoDate(record.dueDate);
  return {
    id: record.id,
    chargeId: record.chargeId,
    customerId: record.customerId,
    title: record.title,
    period: record.period,
    amount: record.amount,
    dueDate,
    status: computeInvoiceStatus(
      { dueDate, paidAt: record.paidAt, hasPendingClaim: record._count.claims > 0 },
      today,
    ),
    publicToken: record.publicToken,
  };
}

export function toOpenInvoice(record: InvoiceRecord, today: IsoDate): OpenInvoice {
  return {
    summary: toInvoiceSummary(record, today),
    customer: record.customer,
    promisedDate: record.promisedDate ? toIsoDate(record.promisedDate) : null,
  };
}
