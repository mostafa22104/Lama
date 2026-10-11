import type { ChargeDto } from '@lamma/shared';
import { toIsoDate } from '../../common/dates/date-codec.js';
import type { ChargeWithCount } from './charges.repository.js';

export function toChargeDto(charge: ChargeWithCount): ChargeDto {
  return {
    id: charge.id,
    kind: charge.kind,
    title: charge.title,
    amount: charge.amount,
    dayOfMonth: charge.dayOfMonth,
    dueDate: charge.dueDate ? toIsoDate(charge.dueDate) : null,
    active: charge.active,
    customerCount: charge._count.assignments,
    createdAt: charge.createdAt.toISOString(),
  };
}
