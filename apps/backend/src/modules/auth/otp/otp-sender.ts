import type { ContactChannel } from '@lamma/shared';

/** Delivers an OTP code over SMS, WhatsApp or email. */
export abstract class OtpSender {
  abstract send(channel: ContactChannel, target: string, code: string): Promise<void>;
}
