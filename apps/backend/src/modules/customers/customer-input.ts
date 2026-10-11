import { type CustomerInput, type Gender, normalizeEgyptianPhone } from '@lamma/shared';
import { AppError } from '../../common/errors/app-error.js';

export interface CustomerRow {
  name: string;
  phone: string;
  note: string | null;
  gender: Gender | null;
}

export function normalizeCustomerPhone(raw: string, field = 'phone'): string {
  const phone = normalizeEgyptianPhone(raw);
  if (!phone) throw new AppError('CONTACT_INVALID', 'Invalid customer phone', { field });
  return phone;
}

export function toCustomerRow(input: CustomerInput, batchIndex?: number): CustomerRow {
  const field = batchIndex === undefined ? 'phone' : `customers.${batchIndex}.phone`;
  return {
    name: input.name,
    phone: normalizeCustomerPhone(input.phone, field),
    note: input.note ?? null,
    gender: input.gender ?? null,
  };
}
