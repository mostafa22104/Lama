import { describe, expect, it } from 'vitest';
import { formatAmount, formatMoney } from './money.js';

describe('formatAmount', () => {
  it('uses Western digits with thousands separators and no decimals', () => {
    expect(formatAmount(23400)).toBe('23,400');
    expect(formatAmount(450)).toBe('450');
    expect(formatAmount(0)).toBe('0');
  });
});

describe('formatMoney', () => {
  it('returns the number and the currency label separately so UIs can size them', () => {
    expect(formatMoney(2850, 'ar')).toEqual({ amount: '2,850', currency: 'ج.م' });
    expect(formatMoney(2850, 'en')).toEqual({ amount: '2,850', currency: 'EGP' });
  });
});
