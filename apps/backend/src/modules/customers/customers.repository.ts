import { Injectable } from '@nestjs/common';
import type { Customer, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../infra/prisma/prisma.service.js';
import type { CustomerRow } from './customer-input.js';

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  countActive(businessId: string): Promise<number> {
    return this.prisma.customer.count({ where: { businessId, archivedAt: null } });
  }

  createMany(businessId: string, rows: CustomerRow[], createdAt: Date): Promise<Customer[]> {
    return this.prisma.customer.createManyAndReturn({
      data: rows.map((row) => ({ ...row, businessId, createdAt })),
    });
  }

  findOwned(businessId: string, id: string): Promise<Customer | null> {
    return this.prisma.customer.findFirst({ where: { id, businessId, archivedAt: null } });
  }

  update(id: string, data: Prisma.CustomerUpdateInput): Promise<Customer> {
    return this.prisma.customer.update({ where: { id }, data });
  }

  async archive(id: string, at: Date): Promise<void> {
    await this.prisma.customer.update({ where: { id }, data: { archivedAt: at } });
  }
}
