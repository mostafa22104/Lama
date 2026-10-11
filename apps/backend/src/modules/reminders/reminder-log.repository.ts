import { Injectable } from '@nestjs/common';
import type { ReminderKind } from '@lamma/shared';
import { PrismaService } from '../../infra/prisma/prisma.service.js';

@Injectable()
export class ReminderLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(invoiceId: string, kind: ReminderKind, sentAt: Date): Promise<void> {
    await this.prisma.reminderLog.create({ data: { invoiceId, kind, channel: 'whatsapp_link', sentAt } });
  }

  findSince(businessId: string, since: Date): Promise<{ invoiceId: string; sentAt: Date }[]> {
    return this.prisma.reminderLog.findMany({
      where: { sentAt: { gte: since }, invoice: { businessId } },
      select: { invoiceId: true, sentAt: true },
    });
  }
}
