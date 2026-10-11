import { describe, expect, it } from 'vitest';
import { canAddCustomers, PLAN_LIMITS } from './plans.js';

describe('plans', () => {
  it('matches the pricing in the design', () => {
    expect(PLAN_LIMITS.free).toEqual({ maxCustomers: 20, priceEgp: 0, autoWhatsApp: false });
    expect(PLAN_LIMITS.basic).toEqual({ maxCustomers: 150, priceEgp: 199, autoWhatsApp: false });
    expect(PLAN_LIMITS.pro).toEqual({ maxCustomers: 500, priceEgp: 399, autoWhatsApp: true });
  });

  it('allows adding customers up to the limit and no further', () => {
    expect(canAddCustomers('free', 19, 1)).toBe(true);
    expect(canAddCustomers('free', 20, 1)).toBe(false);
    expect(canAddCustomers('pro', 0, 500)).toBe(true);
    expect(canAddCustomers('basic', 100, 51)).toBe(false);
  });
});
