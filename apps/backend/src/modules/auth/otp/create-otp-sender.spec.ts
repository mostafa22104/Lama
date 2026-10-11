import { describe, expect, it } from 'vitest';
import { testEnv } from '../../../testing/test-env.js';
import { ConsoleOtpSender } from './console-otp-sender.js';
import { createOtpSender } from './create-otp-sender.js';

describe('createOtpSender', () => {
  it('refuses to run in production', () => {
    expect(() => createOtpSender(testEnv({ NODE_ENV: 'production' }))).toThrow(/No production OtpSender/);
  });

  it('uses the console sender outside production', () => {
    expect(createOtpSender(testEnv())).toBeInstanceOf(ConsoleOtpSender);
  });
});
