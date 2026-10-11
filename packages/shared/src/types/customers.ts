import type { IsoDate } from '../domain/dates.js';
import type { InvoiceStatus } from '../domain/invoiceStatus.js';
import type { ReminderKind } from './reminders.js';

export const GENDERS = ['male', 'female'] as const;
export type Gender = (typeof GENDERS)[number];

export interface CustomerInput {
  name: string;
  phone: string;
  note?: string | null;
  gender?: Gender | null;
}

export type CustomerUpdate = Partial<CustomerInput>;

export interface InvoiceSummaryDto {
  id: string;
  chargeId: string;
  customerId: string;
  /** Raw title; show with invoiceDisplayTitle(). */
  title: string;
  period: string | null;
  amount: number;
  dueDate: IsoDate;
  status: InvoiceStatus;
  publicToken: string;
}

export interface CustomerDto {
  id: string;
  name: string;
  /** E.164, e.g. +201012345678 */
  phone: string;
  note: string | null;
  gender: Gender | null;
  createdAt: string;
}

export interface CustomerListItemDto extends CustomerDto {
  /** Sum of unpaid invoices. */
  balance: number;
  status: InvoiceStatus | null;
  /** The invoice the row talks about: most urgent, then earliest due. */
  headline: InvoiceSummaryDto | null;
}

export interface CustomerDetailDto extends CustomerListItemDto {
  openInvoices: InvoiceSummaryDto[];
  nextDue: { dueDate: IsoDate; amount: number } | null;
}

export interface CustomersBatchResult {
  created: CustomerDto[];
}

export type HistoryEventDto =
  | { type: 'created'; at: string }
  | { type: 'invoice'; at: IsoDate; invoiceId: string; title: string; period: string | null; amount: number; status: InvoiceStatus }
  | { type: 'payment'; at: string; invoiceId: string; title: string; period: string | null; amount: number; method: 'instapay' | 'cash' }
  | { type: 'reminder'; at: string; invoiceId: string; kind: ReminderKind };
