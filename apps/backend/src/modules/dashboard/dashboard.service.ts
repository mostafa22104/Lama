import { Injectable } from '@nestjs/common';
import { type HomeDashboardDto, periodOf } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { BusinessService } from '../business/index.js';
import { CustomersService } from '../customers/index.js';
import { InvoiceQueryService } from '../invoices/index.js';
import { ReminderQueueService } from '../reminders/index.js';

const OVERDUE_PREVIEW = 5;
const REMINDER_PREVIEW = 4;

@Injectable()
export class DashboardService {
  constructor(
    private readonly businesses: BusinessService,
    private readonly customers: CustomersService,
    private readonly invoices: InvoiceQueryService,
    private readonly reminders: ReminderQueueService,
    private readonly clock: Clock,
  ) {}

  async home(businessId: string): Promise<HomeDashboardDto> {
    const today = businessToday(this.clock.now());
    const period = periodOf(today);
    const business = await this.businesses.getById(businessId);
    const open = await this.invoices.openInvoices(businessId, today);
    const totals = await this.invoices.periodSummary(businessId, period, today);
    const reminders = await this.reminders.today(businessId);
    const overdueCustomers = await this.customers.list(businessId, { status: 'overdue' });

    const overdue = open.filter((invoice) => invoice.summary.status === 'overdue');
    return {
      businessName: business.name,
      period,
      expected: totals.expected,
      collected: totals.collected,
      remaining: totals.expected - totals.collected,
      collectedPercent: totals.expected === 0 ? 0 : Math.floor((totals.collected * 100) / totals.expected),
      overdue: {
        amount: overdue.reduce((sum, invoice) => sum + invoice.summary.amount, 0),
        customerCount: new Set(overdue.map((invoice) => invoice.customer.id)).size,
      },
      awaitingConfirmationCount: open.filter((invoice) => invoice.summary.status === 'awaiting_confirmation').length,
      todayReminders: {
        total: reminders.total,
        sentCount: reminders.sentCount,
        preview: reminders.items.slice(0, REMINDER_PREVIEW).map((item) => ({ customerName: item.customerName })),
      },
      overdueCustomers: overdueCustomers.slice(0, OVERDUE_PREVIEW),
    };
  }
}
