import { Module } from '@nestjs/common';
import { BusinessModule } from '../business/index.js';
import { InvoicesModule } from '../invoices/index.js';
import { ReminderLogRepository } from './reminder-log.repository.js';
import { ReminderQueueService } from './reminder-queue.service.js';
import { ReminderRuleRepository } from './reminder-rule.repository.js';
import { RemindersController } from './reminders.controller.js';
import { RemindersService } from './reminders.service.js';

@Module({
  imports: [BusinessModule, InvoicesModule],
  controllers: [RemindersController],
  providers: [ReminderRuleRepository, ReminderLogRepository, ReminderQueueService, RemindersService],
  exports: [ReminderQueueService],
})
export class RemindersModule {}
