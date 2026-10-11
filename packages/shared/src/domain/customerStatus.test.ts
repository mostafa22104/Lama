import { describe, expect, it } from 'vitest';
import { summarizeCustomerStatus } from './customerStatus.js';

describe('summarizeCustomerStatus', () => {
  it('reports the most urgent open status', () => {
    expect(summarizeCustomerStatus(['due_soon', 'overdue', 'upcoming'], true)).toBe('overdue');
    expect(summarizeCustomerStatus(['due_soon', 'awaiting_confirmation'], true)).toBe('awaiting_confirmation');
    expect(summarizeCustomerStatus(['upcoming', 'due_soon'], true)).toBe('due_soon');
  });

  it('is paid when nothing is open but invoices exist, and null with no invoices', () => {
    expect(summarizeCustomerStatus([], true)).toBe('paid');
    expect(summarizeCustomerStatus([], false)).toBeNull();
  });
});
