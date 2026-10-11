import { randomInt } from 'node:crypto';
import { hmacSha256 } from '../../../common/crypto/hash.js';

export const OTP_LENGTH = 6;

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
}

/** Bound to the target so a leaked hash can't be replayed for another contact. */
export function hashOtpCode(code: string, target: string, secret: string): string {
  return hmacSha256(secret, `${target}:${code}`);
}
