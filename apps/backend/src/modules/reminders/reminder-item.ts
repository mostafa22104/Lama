import {
  buildReminderMessage,
  daysBetween,
  invoiceDisplayTitle,
  type IsoDate,
  payLink,
  type ReminderItemDto,
  type ReminderKind,
  whatsappUrl,
} from '@lamma/shared';
import type { OpenInvoice } from '../invoices/index.js';

export interface ReminderContext {
  businessName: string;
  webBaseUrl: string;
  today: IsoDate;
  sentInvoiceIds: Set<string>;
}

export function toReminderItem(open: OpenInvoice, kind: ReminderKind, context: ReminderContext): ReminderItemDto {
  const { summary, customer } = open;
  const message = buildReminderMessage({
    locale: 'ar',
    customerName: customer.name,
    gender: customer.gender,
    businessName: context.businessName,
    title: invoiceDisplayTitle(summary, 'ar'),
    amount: summary.amount,
    daysUntilDue: daysBetween(context.today, summary.dueDate),
    link: payLink(context.webBaseUrl, summary.publicToken),
  });
  return {
    invoiceId: summary.id,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    title: summary.title,
    period: summary.period,
    amount: summary.amount,
    dueDate: summary.dueDate,
    status: summary.status,
    kind,
    message,
    waUrl: whatsappUrl(customer.phone, message),
    sent: context.sentInvoiceIds.has(summary.id),
  };
}
