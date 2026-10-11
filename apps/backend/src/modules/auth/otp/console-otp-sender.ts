import { Logger } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import { OtpSender } from './otp-sender.js';

/** Development only: prints the code to the server log. */
export class ConsoleOtpSender extends OtpSender {
  private readonly logger = new Logger('OTP');

  async send(channel: ContactChannel, target: string, code: string): Promise<void> {
    this.logger.log(`[${channel}] ${target} → ${code}`);
  }
}
