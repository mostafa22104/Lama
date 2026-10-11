import { Module } from '@nestjs/common';
import { InvoiceGenerator } from './invoice-generator.js';
import { InvoiceQueryService } from './invoice-query.service.js';
import { InvoiceRepository } from './invoice.repository.js';

@Module({
  providers: [InvoiceRepository, InvoiceGenerator, InvoiceQueryService],
  exports: [InvoiceGenerator, InvoiceQueryService],
})
export class InvoicesModule {}
