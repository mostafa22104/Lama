import { Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import type { Business } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { NewBusinessInput } from './business.types.js';

@Injectable()
export class BusinessRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Business | null> {
    return this.prisma.business.findUnique({ where: { id } });
  }

  findByContact(channel: ContactChannel, contact: string): Promise<Business | null> {
    const where = channel === 'phone' ? { phone: contact } : { email: contact };
    return this.prisma.business.findUnique({ where });
  }

  createWithDefaultRule(input: NewBusinessInput): Promise<Business> {
    return this.prisma.business.create({
      data: {
        name: input.businessName,
        type: input.businessType,
        instapayAddress: input.instapayAddress,
        phone: input.channel === 'phone' ? input.contact : null,
        email: input.channel === 'email' ? input.contact : null,
        reminderRule: { create: {} },
      },
    });
  }
}
