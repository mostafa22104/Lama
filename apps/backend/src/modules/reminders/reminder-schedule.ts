import { daysBetween, type InvoiceStatus, type IsoDate, type ReminderKind, type ReminderRuleDto } from '@lamma/shared';

export interface SchedulableInvoice {
  dueDate: IsoDate;
  promisedDate: IsoDate | null;
  status: InvoiceStatus;
}

/** Which reminder (if any) this invoice gets today under the business's rule. */
export function reminderKindForToday(
  invoice: SchedulableInvoice,
  rule: ReminderRuleDto,
  today: IsoDate,
): ReminderKind | null {
  if (invoice.status === 'paid' || invoice.status === 'awaiting_confirmation') return null;
  if (invoice.promisedDate === today) return 'promise';
  const daysUntilDue = daysBetween(today, invoice.dueDate);
  if (rule.beforeDays !== null && daysUntilDue === rule.beforeDays) return 'before';
  if (rule.onDueDate && daysUntilDue === 0) return 'on_due';
  if (rule.afterDays !== null && daysUntilDue === -rule.afterDays) return 'after';
  return null;
}
