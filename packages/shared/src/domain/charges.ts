import type { Locale } from '../types/locale.js';
import { dueDateInPeriod, periodOf, type IsoDate } from './dates.js';
import { monthName, nextPeriod } from './periods.js';

/** Monthly charges have no title in the design; invoices show "اشتراك <month>". */
export const DEFAULT_MONTHLY_TITLE = 'اشتراك';

export function invoiceDisplayTitle(
  invoice: { title: string; period: string | null },
  locale: Locale,
): string {
  return invoice.period ? `${invoice.title} ${monthName(invoice.period, locale)}` : invoice.title;
}

export interface MonthlyTerms {
  amount: number;
  dayOfMonth: number;
}

/** The next due date strictly after today across monthly charges, with the total due that day. */
export function nextMonthlyDue(
  charges: MonthlyTerms[],
  today: IsoDate,
): { dueDate: IsoDate; amount: number } | null {
  if (charges.length === 0) return null;
  const current = periodOf(today);
  const dues = charges.map((charge) => {
    const thisMonth = dueDateInPeriod(current, charge.dayOfMonth);
    const dueDate = thisMonth > today ? thisMonth : dueDateInPeriod(nextPeriod(current), charge.dayOfMonth);
    return { dueDate, amount: charge.amount };
  });
  const earliest = dues.reduce((min, due) => (due.dueDate < min ? due.dueDate : min), dues[0].dueDate);
  const amount = dues.filter((due) => due.dueDate === earliest).reduce((sum, due) => sum + due.amount, 0);
  return { dueDate: earliest, amount };
}
