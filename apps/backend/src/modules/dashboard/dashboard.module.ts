import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/index.js';
import { CustomersModule } from '../customers/index.js';
import { InvoicesModule } from '../invoices/index.js';
import { RemindersModule } from '../reminders/index.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [BusinessModule, CustomersModule, InvoicesModule, RemindersModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
