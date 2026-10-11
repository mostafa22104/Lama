import { Module } from '@nestjs/common';
import { InvoiceGenerator } from './invoice-generator.js';
import { InvoiceRepository } from './invoice.repository.js';

@Module({
  providers: [InvoiceRepository, InvoiceGenerator],
  exports: [InvoiceGenerator],
})
export class InvoicesModule {}
