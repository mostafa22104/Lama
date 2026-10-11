import { describe, expect, it } from 'vitest';
import {
  normalizeContact,
  normalizeEgyptianPhone,
  normalizeEmail,
  stripFormatting,
  toWesternDigits,
} from './contact.js';

describe('toWesternDigits', () => {
  it('converts Arabic-Indic and Persian digits', () => {
    expect(toWesternDigits('٤٥٠')).toBe('450');
    expect(toWesternDigits('۴۵۰')).toBe('450');
    expect(toWesternDigits('abc 12')).toBe('abc 12');
  });
});

describe('stripFormatting', () => {
  it('removes bidi marks and whitespace only', () => {
    expect(stripFormatting('\u202A12 3\u202C\u200F 4-5')).toBe('1234-5');
  });
});

describe('normalizeEgyptianPhone', () => {
  it.each([
    '01012345678',
    '010 1234 5678',
    '010-1234-5678',
    '+20 10 1234 5678',
    '00201012345678',
    '201012345678',
    '٠١٠١٢٣٤٥٦٧٨',
    '+20 010 1234 5678',
    '0020 010 1234 5678',
    '20 010 1234 5678',
    '\u202A+20 10 1234 5678\u202C',
    '\u200E01012345678',
    '\u2066010 1234 5678\u2069',
    '\u200F01012345678',
    '010.1234.5678',
    '010/1234/5678',
  ])('normalizes %s to E.164', (raw) => {
    expect(normalizeEgyptianPhone(raw)).toBe('+201012345678');
  });

  it('accepts all four mobile prefixes', () => {
    for (const prefix of ['010', '011', '012', '015']) {
      expect(normalizeEgyptianPhone(`${prefix}12345678`)).toBe(`+20${prefix.slice(1)}12345678`);
    }
  });

  it.each(['0101234567', '01312345678', '012345678901', 'abc', ''])('rejects %s', (raw) => {
    expect(normalizeEgyptianPhone(raw)).toBeNull();
  });
});

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Owner@Example.COM ')).toBe('owner@example.com');
  });

  it.each(['no-at-sign', 'a@b', '@example.com', 'a b@example.com'])('rejects %s', (raw) => {
    expect(normalizeEmail(raw)).toBeNull();
  });
});

describe('normalizeContact', () => {
  it('dispatches on channel', () => {
    expect(normalizeContact('phone', '01012345678')).toBe('+201012345678');
    expect(normalizeContact('email', 'A@B.co')).toBe('a@b.co');
    expect(normalizeContact('phone', 'a@b.co')).toBeNull();
  });
});
