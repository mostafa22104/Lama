import type { RefreshToken } from '../generated/prisma/client.js';

/** Same contract as RefreshTokenRepository, backed by an array. */
export class InMemoryRefreshTokenRepository {
  readonly records: RefreshToken[] = [];

  async create(businessId: string, tokenHash: string, expiresAt: Date): Promise<RefreshToken> {
    const record: RefreshToken = {
      id: `rt_${this.records.length + 1}`,
      businessId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.records.push(record);
    return record;
  }

  async findActiveByHash(tokenHash: string, now: Date): Promise<RefreshToken | null> {
    return (
      this.records.find((r) => r.tokenHash === tokenHash && !r.revokedAt && r.expiresAt > now) ??
      null
    );
  }

  async revoke(id: string, now: Date): Promise<number> {
    const record = this.records.find((r) => r.id === id && !r.revokedAt);
    if (!record) return 0;
    record.revokedAt = now;
    return 1;
  }

  async revokeByHash(tokenHash: string, now: Date): Promise<void> {
    for (const r of this.records) if (r.tokenHash === tokenHash && !r.revokedAt) r.revokedAt = now;
  }
}
