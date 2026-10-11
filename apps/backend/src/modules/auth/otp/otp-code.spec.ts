import { describe, expect, it } from 'vitest';
import { generateOtpCode, hashOtpCode, OTP_LENGTH } from './otp-code.js';

describe('otp code', () => {
  it('generates 6 digits, keeping leading zeros', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateOtpCode()).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`));
    }
  });

  it('hash is bound to the target and the secret', () => {
    const base = hashOtpCode('123456', '+201012345678', 's'.repeat(32));
    expect(hashOtpCode('123456', '+201012345678', 's'.repeat(32))).toBe(base);
    expect(hashOtpCode('123456', '+201112345678', 's'.repeat(32))).not.toBe(base);
    expect(hashOtpCode('123456', '+201012345678', 't'.repeat(32))).not.toBe(base);
    expect(base).not.toContain('123456');
  });
});
