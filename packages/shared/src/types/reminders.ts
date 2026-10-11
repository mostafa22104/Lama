import type { IsoDate } from '../domain/dates.js';
import type { InvoiceStatus } from '../domain/invoiceStatus.js';

export const REMINDER_KINDS = ['before', 'on_due', 'after', 'promise', 'manual'] as const;
export type ReminderKind = (typeof REMINDER_KINDS)[number];

export interface ReminderRuleDto {
  beforeDays: number | null;
  onDueDate: boolean;
  afterDays: number | null;
}

export interface ReminderItemDto {
  invoiceId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  title: string;
  period: string | null;
  amount: number;
  dueDate: IsoDate;
  status: InvoiceStatus;
  kind: ReminderKind;
  message: string;
  waUrl: string;
  sent: boolean;
}

export interface TodayRemindersDto {
  date: IsoDate;
  total: number;
  sentCount: number;
  items: ReminderItemDto[];
}

export interface MarkSentInput {
  kind: ReminderKind;
}
