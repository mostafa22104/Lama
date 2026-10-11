import { Injectable } from '@nestjs/common';
import type { ReminderItemDto, ReminderKind, ReminderRuleDto } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { businessToday } from '../../common/dates/date-codec.js';
import { AppError } from '../../common/errors/app-error.js';
import { InvoiceQueryService } from '../invoices/index.js';
import { toReminderItem } from './reminder-item.js';
import { ReminderLogRepository } from './reminder-log.repository.js';
import { ReminderQueueService } from './reminder-queue.service.js';
import { ReminderRuleRepository } from './reminder-rule.repository.js';
import { reminderKindForToday } from './reminder-schedule.js';

@Injectable()
export class RemindersService {
  constructor(
    private readonly rules: ReminderRuleRepository,
    private readonly logs: ReminderLogRepository,
    private readonly queue: ReminderQueueService,
    private readonly invoices: InvoiceQueryService,
    private readonly clock: Clock,
  ) {}

  getRule(businessId: string): Promise<ReminderRuleDto> {
    return this.rules.get(businessId);
  }

  saveRule(businessId: string, rule: ReminderRuleDto): Promise<ReminderRuleDto> {
    return this.rules.save(businessId, rule);
  }

  async forInvoice(businessId: string, invoiceId: string): Promise<ReminderItemDto> {
    const context = await this.queue.context(businessId);
    const invoice = await this.invoices.findOne(businessId, invoiceId, context.today);
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found');
    if (invoice.summary.status === 'paid') throw new AppError('INVOICE_ALREADY_PAID', 'Invoice already paid');
    const rule = await this.rules.get(businessId);
    const scheduled = reminderKindForToday({ ...invoice.summary, promisedDate: invoice.promisedDate }, rule, context.today);
    return toReminderItem(invoice, scheduled ?? 'manual', context);
  }

  async markSent(businessId: string, invoiceId: string, kind: ReminderKind): Promise<void> {
    const now = this.clock.now();
    const invoice = await this.invoices.findOne(businessId, invoiceId, businessToday(now));
    if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found');
    await this.logs.create(invoiceId, kind, now);
  }
}
