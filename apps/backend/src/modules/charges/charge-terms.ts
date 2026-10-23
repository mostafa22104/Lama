import { type ChargeInput, DEFAULT_MONTHLY_TITLE } from '@lamma/shared';
import { isValidIsoDate } from '../../common/dates/date-codec.js';
import { fieldError } from '../../common/errors/field-error.js';
import type { ChargeTerms } from '../invoices/index.js';

/** Checks the kind-specific rules a DTO can't express and fills defaults. */
export function toChargeTerms(input: ChargeInput): ChargeTerms {
  if (input.kind === 'monthly') {
    let day = input.dayOfMonth;
    if (day === undefined) {
      if (input.collectionTiming === 'end') day = 31;
      else if (input.startDate) day = Number(input.startDate.slice(8, 10)) || 1;
      else throw fieldError('dayOfMonth', 'required');
    }
    return {
      kind: 'monthly',
      title: input.title ?? DEFAULT_MONTHLY_TITLE,
      amount: input.amount,
      dayOfMonth: day,
      dueDate: null,
      ...(input.startDate ? { startDate: input.startDate } : {}),
    };
  }
  if (!input.title) throw fieldError('title', 'required');
  const due = input.dueDate ?? input.startDate;
  if (!due) throw fieldError('dueDate', 'required');
  if (!isValidIsoDate(due)) throw fieldError('dueDate', 'invalidDate');
  return {
    kind: 'one_time',
    title: input.title,
    amount: input.amount,
    dayOfMonth: null,
    dueDate: due,
    ...(input.startDate ? { startDate: input.startDate } : {}),
  };
}
