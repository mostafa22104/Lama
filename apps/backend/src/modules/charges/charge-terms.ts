import { type ChargeInput, DEFAULT_MONTHLY_TITLE } from '@lamma/shared';
import { isValidIsoDate } from '../../common/dates/date-codec.js';
import { fieldError } from '../../common/errors/field-error.js';
import type { ChargeTerms } from '../invoices/index.js';

/** Checks the kind-specific rules a DTO can't express and fills defaults. */
export function toChargeTerms(input: ChargeInput): ChargeTerms {
  if (input.kind === 'monthly') {
    if (input.dayOfMonth === undefined) throw fieldError('dayOfMonth', 'required');
    return {
      kind: 'monthly',
      title: input.title ?? DEFAULT_MONTHLY_TITLE,
      amount: input.amount,
      dayOfMonth: input.dayOfMonth,
      dueDate: null,
    };
  }
  if (!input.title) throw fieldError('title', 'required');
  if (!input.dueDate) throw fieldError('dueDate', 'required');
  if (!isValidIsoDate(input.dueDate)) throw fieldError('dueDate', 'invalidDate');
  return { kind: 'one_time', title: input.title, amount: input.amount, dayOfMonth: null, dueDate: input.dueDate };
}
