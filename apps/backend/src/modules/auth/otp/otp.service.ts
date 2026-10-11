import { Inject, Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import { safeEqualHex } from '../../../common/crypto/hash.js';
import { AppError } from '../../../common/errors/app-error.js';
import { ENV, type Env } from '../../../config/env.js';
import { generateOtpCode, hashOtpCode } from './otp-code.js';
import { OtpRepository } from './otp.repository.js';
import { OtpSender } from './otp-sender.js';

@Injectable()
export class OtpService {
  constructor(
    private readonly otps: OtpRepository,
    private readonly sender: OtpSender,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async request(channel: ContactChannel, target: string, now = new Date()): Promise<void> {
    const latest = await this.otps.findLatest(target);
    const cooldownMs = this.env.OTP_RESEND_COOLDOWN_SECONDS * 1000;
    if (latest && now.getTime() - latest.createdAt.getTime() < cooldownMs) {
      throw new AppError('OTP_COOLDOWN', 'Code requested too recently');
    }

    await this.otps.invalidateOpen(target, now);
    const code = generateOtpCode();
    await this.otps.create({
      channel,
      target,
      codeHash: hashOtpCode(code, target, this.env.OTP_SECRET),
      expiresAt: new Date(now.getTime() + this.env.OTP_TTL_SECONDS * 1000),
      createdAt: now,
    });
    await this.sender.send(channel, target, code);
  }

  /** Validates the code without consuming it; returns the OTP id to consume later. */
  async check(target: string, code: string, now = new Date()): Promise<string> {
    const latest = await this.otps.findLatest(target);
    if (!latest || latest.consumedAt) throw new AppError('OTP_INVALID', 'No active code');
    if (latest.expiresAt <= now) throw new AppError('OTP_EXPIRED', 'Code expired');
    if (!(await this.otps.reserveAttempt(latest.id, this.env.OTP_MAX_ATTEMPTS))) {
      throw new AppError('OTP_TOO_MANY_ATTEMPTS', 'Too many attempts');
    }

    const candidate = hashOtpCode(code, target, this.env.OTP_SECRET);
    if (!safeEqualHex(latest.codeHash, candidate)) {
      throw new AppError('OTP_INVALID', 'Wrong code');
    }
    await this.otps.refundAttempt(latest.id);
    return latest.id;
  }

  async consume(otpId: string, now = new Date()): Promise<void> {
    const consumed = await this.otps.consume(otpId, now);
    if (consumed === 0) throw new AppError('OTP_INVALID', 'Code already used');
  }
}
