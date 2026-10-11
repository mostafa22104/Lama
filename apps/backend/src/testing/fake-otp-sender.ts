import type { ContactChannel } from '@lamma/shared';
import { OtpSender } from '../modules/auth/otp/otp-sender.js';

export class FakeOtpSender extends OtpSender {
  private readonly codes = new Map<string, string>();

  async send(_channel: ContactChannel, target: string, code: string): Promise<void> {
    this.codes.set(target, code);
  }

  lastCodeFor(target: string): string {
    const code = this.codes.get(target);
    if (!code) throw new Error(`No OTP was sent to ${target}`);
    return code;
  }
}
