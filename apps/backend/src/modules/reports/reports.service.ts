import { Injectable } from '@nestjs/common';
import { type MonthlyReportDto, periodOf, previousPeriod } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { CustomersService } from '../customers/index.js';
import { InvoiceQueryService } from '../invoices/index.js';

@Injectable()
export class ReportsService {
  constructor(
    private readonly invoices: InvoiceQueryService,
    private readonly customers: CustomersService,
    private readonly clock: Clock,
  ) {}

  async monthly(businessId: string, requested?: string): Promise<MonthlyReportDto> {
    const period = requested ?? periodOf(businessToday(this.clock.now()));
    const stillLate = await this.customers.list(businessId, { status: 'overdue' });
    const current = await this.invoices.periodSummary(businessId, period);
    const previous = await this.invoices.periodSummary(businessId, previousPeriod(period));
    return {
      period,
      expected: current.expected,
      collected: current.collected,
      previousCollected: previous.collected,
      invoiceCount: current.invoiceCount,
      paidInvoiceCount: current.paidCount,
      stillLate,
    };
  }
}
