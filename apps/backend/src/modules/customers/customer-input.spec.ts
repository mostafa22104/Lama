import { describe, expect, it } from 'vitest';
import { toCustomerRow } from './customer-input.js';

describe('toCustomerRow', () => {
  it('normalizes the phone and fills optional fields', () => {
    expect(toCustomerRow({ name: 'سارة عادل', phone: '٠١٠ ٢٣٤٥ ٦٧٨١' })).toEqual({
      name: 'سارة عادل',
      phone: '+201023456781',
      note: null,
      gender: null,
    });
  });

  it('reports the failing field, with the batch index when given', () => {
    expect(() => toCustomerRow({ name: 'x', phone: '123' })).toThrow(
      expect.objectContaining({ code: 'CONTACT_INVALID', details: { field: 'phone' } }),
    );
    expect(() => toCustomerRow({ name: 'x', phone: '123' }, 4)).toThrow(
      expect.objectContaining({ details: { field: 'customers.4.phone' } }),
    );
  });
});
