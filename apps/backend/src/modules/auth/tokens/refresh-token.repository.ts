import { Injectable } from '@nestjs/common';
import type { RefreshToken } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../infra/prisma/prisma.service.js';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(businessId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({ data: { businessId, tokenHash, expiresAt } });
  }

  findActiveByHash(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
    });
  }

  /** Returns 1 when this call revoked the token, 0 when it was already revoked. */
  async revoke(id: string, now: Date): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: now },
    });
    return count;
  }

  async revokeByHash(tokenHash: string, now: Date): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}
