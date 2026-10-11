import type { CustomerDto, InvoiceSummaryDto } from '@lamma/shared';
import { describe, expect, it } from 'vitest';
import { buildCustomerListItem } from './customer-summary.js';

const customer: CustomerDto = { id: 'c1', name: 'محمود', phone: '+201023456781', note: null, gender: 'male', createdAt: '2026-09-01T00:00:00.000Z' };
const invoice = (over: Partial<InvoiceSummaryDto>): InvoiceSummaryDto => ({
  id: 'i', chargeId: 'ch', customerId: 'c1', title: 'اشتراك', period: '2026-09', amount: 450,
  dueDate: '2026-09-20', status: 'overdue', publicToken: 't', ...over,
});

describe('buildCustomerListItem', () => {
  it('sums the balance and headlines the most urgent invoice', () => {
    const item = buildCustomerListItem(
      customer,
      [
        invoice({ id: 'soon', status: 'due_soon', dueDate: '2026-09-26', amount: 300 }),
        invoice({ id: 'late', status: 'overdue', dueDate: '2026-09-20', amount: 450 }),
      ],
      true,
    );
    expect(item).toMatchObject({ balance: 750, status: 'overdue', headline: { id: 'late' } });
  });

  it('is paid with zero balance when nothing is open', () => {
    expect(buildCustomerListItem(customer, [], true)).toMatchObject({ balance: 0, status: 'paid', headline: null });
    expect(buildCustomerListItem(customer, [], false).status).toBeNull();
  });
});
