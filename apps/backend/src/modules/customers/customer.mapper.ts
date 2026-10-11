import type { CustomerDto } from '@lamma/shared';
import type { Customer } from '../../generated/prisma/client.js';

export function toCustomerDto(customer: Customer): CustomerDto {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    note: customer.note,
    gender: customer.gender,
    createdAt: customer.createdAt.toISOString(),
  };
}
