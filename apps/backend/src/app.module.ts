import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthCoreModule } from './common/auth/auth-core.module.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BusinessModule } from './modules/business/index.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthCoreModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    HealthModule,
    BusinessModule,
    AuthModule,
  ],
})
export class AppModule {}
