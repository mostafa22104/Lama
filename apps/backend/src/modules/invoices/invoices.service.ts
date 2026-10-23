import { Injectable } from '@nestjs/common';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { AppError } from '../../common/errors/app-error.js';
import { toInvoiceSummary } from './invoice-record.js';
import { InvoiceRepository } from './invoice.repository.js';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly invoices: InvoiceRepository,
    private readonly clock: Clock,
  ) {}

  async recordCash(businessId: string, id: string, amount?: number): Promise<InvoiceSummaryDto> {
    if (amount !== undefined && (typeof amount !== 'number' || isNaN(amount) || amount <= 0)) {
      throw new AppError('VALIDATION_FAILED', 'Amount must be greater than zero');
    }
    const now = this.clock.now();
    const result = await this.invoices.markPaidInCash(businessId, id, now, amount ? Math.round(amount) : undefined);
    if (result === 'not_found') throw new AppError('NOT_FOUND', 'Invoice not found');
    if (result === 'already_paid') throw new AppError('INVOICE_ALREADY_PAID', 'Invoice already paid');
    return toInvoiceSummary(result, businessToday(now));
  }
}
