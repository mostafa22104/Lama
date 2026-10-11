import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { sha256 } from '../../../common/crypto/hash.js';
import { AppError } from '../../../common/errors/app-error.js';
import { ENV, type Env } from '../../../config/env.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';

const MS_PER_DAY = 86_400_000;

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly tokens: RefreshTokenRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async issue(businessId: string, now = new Date()): Promise<string> {
    const token = randomBytes(48).toString('base64url');
    const expiresAt = new Date(now.getTime() + this.env.REFRESH_TTL_DAYS * MS_PER_DAY);
    await this.tokens.create(businessId, sha256(token), expiresAt);
    return token;
  }

  async rotate(token: string, now = new Date()): Promise<{ businessId: string; refreshToken: string }> {
    const record = await this.tokens.findActiveByHash(sha256(token), now);
    if (!record) throw new AppError('TOKEN_INVALID', 'Refresh token is invalid');

    // A concurrent rotation of the same token revokes it first; only one caller wins.
    const revoked = await this.tokens.revoke(record.id, now);
    if (revoked === 0) throw new AppError('TOKEN_INVALID', 'Refresh token already used');

    return { businessId: record.businessId, refreshToken: await this.issue(record.businessId, now) };
  }

  async revoke(token: string, now = new Date()): Promise<void> {
    await this.tokens.revokeByHash(sha256(token), now);
  }
}
