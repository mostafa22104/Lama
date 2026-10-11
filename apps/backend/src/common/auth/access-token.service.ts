import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ENV, type Env } from '../../config/env.js';
import { AppError } from '../errors/app-error.js';

export interface AccessTokenPayload {
  sub: string;
}

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  get ttlSeconds(): number {
    return this.env.JWT_ACCESS_TTL_SECONDS;
  }

  sign(businessId: string): string {
    const payload: AccessTokenPayload = { sub: businessId };
    return this.jwt.sign(payload, {
      secret: this.env.JWT_ACCESS_SECRET,
      algorithm: 'HS256',
      expiresIn: this.env.JWT_ACCESS_TTL_SECONDS,
    });
  }

  verify(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify<AccessTokenPayload>(token, {
        secret: this.env.JWT_ACCESS_SECRET,
        algorithms: ['HS256'],
      });
    } catch {
      throw new AppError('TOKEN_INVALID', 'Access token is invalid or expired');
    }
  }
}
