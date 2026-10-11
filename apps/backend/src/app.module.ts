import { Module } from '@nestjs/common';
import { AuthCoreModule } from './common/auth/auth-core.module.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { BusinessModule } from './modules/business/business.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [ConfigModule, PrismaModule, AuthCoreModule, HealthModule, BusinessModule],
})
export class AppModule {}
