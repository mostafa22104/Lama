import { Module } from '@nestjs/common';
import { ENV } from '../../config/env.js';
import { BusinessModule } from '../business/index.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { createOtpSender } from './otp/create-otp-sender.js';
import { OtpRepository } from './otp/otp.repository.js';
import { OtpSender } from './otp/otp-sender.js';
import { OtpService } from './otp/otp.service.js';
import { RefreshTokenRepository } from './tokens/refresh-token.repository.js';
import { RefreshTokenService } from './tokens/refresh-token.service.js';

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
