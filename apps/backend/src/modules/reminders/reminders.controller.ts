import { Body, Controller, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import type { ReminderItemDto, ReminderRuleDto, TodayRemindersDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { MarkSentDto } from './dto/mark-sent.dto.js';
import { UpdateReminderRuleDto } from './dto/update-reminder-rule.dto.js';
import { ReminderQueueService } from './reminder-queue.service.js';
import { RemindersService } from './reminders.service.js';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(
    private readonly reminders: RemindersService,
    private readonly queue: ReminderQueueService,
  ) {}

  @Get('rule')
  getRule(@CurrentBusinessId() businessId: string): Promise<ReminderRuleDto> {
    return this.reminders.getRule(businessId);
  }

  @Put('rule')
  saveRule(@CurrentBusinessId() businessId: string, @Body() dto: UpdateReminderRuleDto): Promise<ReminderRuleDto> {
    return this.reminders.saveRule(businessId, {
      beforeDays: dto.beforeDays,
      onDueDate: dto.onDueDate,
      afterDays: dto.afterDays,
    });
  }

  @Get('today')
  today(@CurrentBusinessId() businessId: string): Promise<TodayRemindersDto> {
    return this.queue.today(businessId);
  }

  @Get('invoices/:invoiceId')
  forInvoice(@CurrentBusinessId() businessId: string, @Param('invoiceId') invoiceId: string): Promise<ReminderItemDto> {
    return this.reminders.forInvoice(businessId, invoiceId);
  }

  @Post(':invoiceId/sent')
  @HttpCode(204)
  async markSent(
    @CurrentBusinessId() businessId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: MarkSentDto,
  ): Promise<void> {
    await this.reminders.markSent(businessId, invoiceId, dto.kind);
  }
}
