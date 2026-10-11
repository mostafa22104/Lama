import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';
import { InvoiceGenerator } from './invoice-generator.js';
import { InvoiceQueryService } from './invoice-query.service.js';
import { InvoiceRepository } from './invoice.repository.js';

@Module({
  controllers: [InvoicesController],
  providers: [InvoiceRepository, InvoiceGenerator, InvoiceQueryService, InvoicesService],
  exports: [InvoiceGenerator, InvoiceQueryService],
})
export class InvoicesModule {}
