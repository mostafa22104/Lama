import { Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import type { OtpCode } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infra/prisma/prisma.service.js';

export interface NewOtp {
  channel: ContactChannel;
  target: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: NewOtp): Promise<OtpCode> {
    return this.prisma.otpCode.create({ data });
  }

  findLatest(target: string): Promise<OtpCode | null> {
    return this.prisma.otpCode.findFirst({ where: { target }, orderBy: { createdAt: 'desc' } });
  }

  async invalidateOpen(target: string, now: Date): Promise<void> {
    await this.prisma.otpCode.updateMany({
      where: { target, consumedAt: null },
      data: { consumedAt: now },
    });
  }

  /** Atomically takes one attempt; false when the code is consumed or out of attempts. */
  async reserveAttempt(id: string, maxAttempts: number): Promise<boolean> {
    const { count } = await this.prisma.otpCode.updateMany({
      where: { id, consumedAt: null, attempts: { lt: maxAttempts } },
      data: { attempts: { increment: 1 } },
    });
    return count === 1;
  }

  /** Gives back an attempt reserved by a check whose code turned out to be right. */
  async refundAttempt(id: string): Promise<void> {
    await this.prisma.otpCode.updateMany({
      where: { id, attempts: { gt: 0 } },
      data: { attempts: { decrement: 1 } },
    });
  }

  /** Returns 1 when this call consumed the code, 0 when it was already consumed. */
  async consume(id: string, now: Date): Promise<number> {
    const { count } = await this.prisma.otpCode.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: now },
    });
    return count;
  }
}
