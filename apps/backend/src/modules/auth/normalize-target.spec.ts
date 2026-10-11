import { describe, expect, it } from 'vitest';
import { normalizeTarget } from './normalize-target.js';

describe('normalizeTarget', () => {
  it('returns the normalized contact', () => {
    expect(normalizeTarget('phone', '010 1234 5678')).toBe('+201012345678');
    expect(normalizeTarget('email', ' A@B.co ')).toBe('a@b.co');
  });

  it('throws CONTACT_INVALID for unusable input', () => {
    expect(() => normalizeTarget('phone', '12345')).toThrow(
      expect.objectContaining({ code: 'CONTACT_INVALID' }),
    );
  });
});
