import type { Env } from '../../../config/env.js';
import { ConsoleOtpSender } from './console-otp-sender.js';
import type { OtpSender } from './otp-sender.js';

export function createOtpSender(env: Env): OtpSender {
  if (env.NODE_ENV === 'production') {
    throw new Error('No production OtpSender is configured; refusing to log OTP codes');
  }
  return new ConsoleOtpSender();
}
