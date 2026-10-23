import { type ChargeKind, dueDateInPeriod, type IsoDate } from '@lamma/shared';
import { generatePublicToken } from '../../common/crypto/public-token.js';
import { fromIsoDate } from '../../common/dates/date-codec.js';

export interface ChargeTerms {
  kind: ChargeKind;
  title: string;
  amount: number;
  dayOfMonth: number | null;
  dueDate: IsoDate | null;
  startDate?: IsoDate | null;
}

export interface InvoiceRow {
  customerId: string;
  period: string | null;
  title: string;
  amount: number;
  dueDate: Date;
  publicToken: string;
}

function row(terms: ChargeTerms, customerId: string, period: string | null, dueDate: IsoDate): InvoiceRow {
  return {
    customerId,
    period,
    title: terms.title,
    amount: terms.amount,
    dueDate: fromIsoDate(dueDate),
    publicToken: generatePublicToken(),
  };
}

/** Monthly: one row per period per customer. One-time: one row per customer; periods are ignored. */
export function buildInvoiceRows(terms: ChargeTerms, customerIds: string[], periods: string[]): InvoiceRow[] {
  const { dayOfMonth, dueDate } = terms;
  if (terms.kind === 'one_time') {
    if (!dueDate) throw new Error('One-time charge has no due date');
    return customerIds.map((customerId) => row(terms, customerId, null, dueDate));
  }
  if (dayOfMonth === null) throw new Error('Monthly charge has no day of month');
  return periods.flatMap((period) =>
    customerIds.map((customerId) => row(terms, customerId, period, dueDateInPeriod(period, dayOfMonth))),
  );
}
