import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthCoreModule } from './common/auth/auth-core.module.js';
import { ClockModule } from './common/clock/clock.module.js';
import { ConfigModule } from './config/config.module.js';
import { PrismaModule } from './infra/prisma/prisma.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BusinessModule } from './modules/business/index.js';
import { ChargesModule } from './modules/charges/index.js';
import { CustomersModule } from './modules/customers/index.js';
import { DashboardModule } from './modules/dashboard/index.js';
import { HealthModule } from './modules/health/health.module.js';
import { InvoicesModule } from './modules/invoices/index.js';
import { PaymentsModule } from './modules/payments/index.js';
import { RemindersModule } from './modules/reminders/index.js';
import { ReportsModule } from './modules/reports/index.js';

@Module({
  imports: [
    ConfigModule,
    ClockModule,
    PrismaModule,
    AuthCoreModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 10 }]),
    HealthModule,
    BusinessModule,
    CustomersModule,
    InvoicesModule,
    PaymentsModule,
    ChargesModule,
    RemindersModule,
    ReportsModule,
    DashboardModule,
    AuthModule,
  ],
})
export class AppModule {}
