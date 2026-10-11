import { Module } from '@nestjs/common';
import { ENV, type Env } from '../../config/env.js';
import { BusinessModule } from '../business/business.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { ConsoleOtpSender } from './otp/console-otp-sender.js';
import { OtpRepository } from './otp/otp.repository.js';
import { OtpSender } from './otp/otp-sender.js';
import { OtpService } from './otp/otp.service.js';
import { RefreshTokenRepository } from './tokens/refresh-token.repository.js';
import { RefreshTokenService } from './tokens/refresh-token.service.js';

function createOtpSender(env: Env): OtpSender {
  if (env.NODE_ENV === 'production') {
    throw new Error('No production OtpSender is configured; refusing to log OTP codes');
  }
  return new ConsoleOtpSender();
}

@Module({
  imports: [BusinessModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    OtpRepository,
    RefreshTokenService,
    RefreshTokenRepository,
    { provide: OtpSender, useFactory: createOtpSender, inject: [ENV] },
  ],
})
export class AuthModule {}
