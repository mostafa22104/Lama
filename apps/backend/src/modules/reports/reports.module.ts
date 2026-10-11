import { Module } from '@nestjs/common';
import { CustomersModule } from '../customers/index.js';
import { InvoicesModule } from '../invoices/index.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [CustomersModule, InvoicesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
