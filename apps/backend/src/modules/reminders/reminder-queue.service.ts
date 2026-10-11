import { Inject, Injectable } from '@nestjs/common';
import { type ReminderKind, type TodayRemindersDto, toBusinessDate } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { ENV, type Env } from '../../config/env.js';
import { BusinessService } from '../business/index.js';
import { InvoiceQueryService } from '../invoices/index.js';
import { type ReminderContext, toReminderItem } from './reminder-item.js';
import { ReminderLogRepository } from './reminder-log.repository.js';
import { ReminderRuleRepository } from './reminder-rule.repository.js';
import { reminderKindForToday } from './reminder-schedule.js';

const KIND_ORDER: ReminderKind[] = ['before', 'on_due', 'promise', 'after', 'manual'];
const LOOKBACK_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class ReminderQueueService {
  constructor(
    private readonly invoices: InvoiceQueryService,
    private readonly businesses: BusinessService,
    private readonly rules: ReminderRuleRepository,
    private readonly logs: ReminderLogRepository,
    private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async context(businessId: string): Promise<ReminderContext> {
    const now = this.clock.now();
    const today = businessToday(now);
    const business = await this.businesses.getById(businessId);
    const recent = await this.logs.findSince(businessId, new Date(now.getTime() - LOOKBACK_MS));
    const sentToday = recent.filter((log) => toBusinessDate(log.sentAt) === today).map((log) => log.invoiceId);
    return { businessName: business.name, webBaseUrl: this.env.WEB_BASE_URL, today, sentInvoiceIds: new Set(sentToday) };
  }

  async today(businessId: string): Promise<TodayRemindersDto> {
    const context = await this.context(businessId);
    const rule = await this.rules.get(businessId);
    const open = await this.invoices.openInvoices(businessId, context.today);
    const items = open
      .flatMap((invoice) => {
        const kind = reminderKindForToday({ ...invoice.summary, promisedDate: invoice.promisedDate }, rule, context.today);
        return kind ? [toReminderItem(invoice, kind, context)] : [];
      })
      .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
    return { date: context.today, total: items.length, sentCount: items.filter((i) => i.sent).length, items };
  }
}
