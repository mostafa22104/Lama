import { describe, expect, it } from 'vitest';
import { hmacSha256, safeEqualHex, sha256 } from './hash.js';

describe('hash helpers', () => {
  it('sha256 is deterministic hex', () => {
    expect(sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hmacSha256 depends on the secret', () => {
    expect(hmacSha256('k1', 'v')).not.toBe(hmacSha256('k2', 'v'));
    expect(hmacSha256('k1', 'v')).toBe(hmacSha256('k1', 'v'));
  });

  it('safeEqualHex compares without throwing on length mismatch', () => {
    expect(safeEqualHex('abcd', 'abcd')).toBe(true);
    expect(safeEqualHex('abcd', 'abce')).toBe(false);
    expect(safeEqualHex('abcd', 'ab')).toBe(false);
  });
});
