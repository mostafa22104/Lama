import { Injectable } from '@nestjs/common';
import type { AuthResponse, AuthTokens } from '@lamma/shared';
import { AccessTokenService } from '../../common/auth/access-token.service.js';
import { AppError } from '../../common/errors/app-error.js';
import { toBusinessDto } from '../business/business.mapper.js';
import { BusinessService } from '../business/business.service.js';
import type { OtpRequestDto } from './dto/otp-request.dto.js';
import type { OtpVerifyDto } from './dto/otp-verify.dto.js';
import { normalizeTarget } from './normalize-target.js';
import { OtpService } from './otp/otp.service.js';
import { RefreshTokenService } from './tokens/refresh-token.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly otp: OtpService,
    private readonly businesses: BusinessService,
    private readonly accessTokens: AccessTokenService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  async requestOtp(dto: OtpRequestDto): Promise<void> {
    await this.otp.request(dto.channel, normalizeTarget(dto.channel, dto.contact));
  }

  async verifyOtp(dto: OtpVerifyDto): Promise<AuthResponse> {
    const contact = normalizeTarget(dto.channel, dto.contact);
    const otpId = await this.otp.check(contact, dto.code);

    const existing = await this.businesses.findByContact(dto.channel, contact);
    // Checked before consuming so the login screen can hand the same code to signup.
    if (!existing && !dto.signup) throw new AppError('SIGNUP_REQUIRED', 'No account for contact');
    await this.otp.consume(otpId);

    const business =
      existing ?? (await this.businesses.create({ channel: dto.channel, contact, ...dto.signup! }));
    return {
      business: toBusinessDto(business),
      tokens: await this.issueTokens(business.id),
      isNewBusiness: !existing,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const rotated = await this.refreshTokens.rotate(refreshToken);
    return this.tokensFor(rotated.businessId, rotated.refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokens.revoke(refreshToken);
  }

  private async issueTokens(businessId: string): Promise<AuthTokens> {
    return this.tokensFor(businessId, await this.refreshTokens.issue(businessId));
  }

  private tokensFor(businessId: string, refreshToken: string): AuthTokens {
    return {
      accessToken: this.accessTokens.sign(businessId),
      refreshToken,
      accessTokenExpiresIn: this.accessTokens.ttlSeconds,
    };
  }
}
