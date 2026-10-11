import { Injectable } from '@nestjs/common';
import type { ReminderRuleDto } from '@lamma/shared';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

const SELECT = { beforeDays: true, onDueDate: true, afterDays: true } as const;

@Injectable()
export class ReminderRuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the default rule on first read for businesses that predate it. */
  get(businessId: string): Promise<ReminderRuleDto> {
    return this.prisma.reminderRule.upsert({
      where: { businessId },
      create: { businessId },
      update: {},
      select: SELECT,
    });
  }

  save(businessId: string, rule: ReminderRuleDto): Promise<ReminderRuleDto> {
    return this.prisma.reminderRule.upsert({
      where: { businessId },
      create: { businessId, ...rule },
      update: rule,
      select: SELECT,
    });
  }
}
