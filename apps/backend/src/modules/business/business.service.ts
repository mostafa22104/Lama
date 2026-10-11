import { Injectable } from '@nestjs/common';
import { type BusinessUpdate, type BusinessUsageDto, type ContactChannel, PLAN_LIMITS } from '@lamma/shared';
import { Clock } from '../../common/clock/clock.js';
import { AppError } from '../../common/errors/app-error.js';
import type { Business } from '../../generated/prisma/client.js';
import { BusinessRepository } from './business.repository.js';
import type { NewBusinessInput } from './business.types.js';

@Injectable()
export class BusinessService {
  constructor(
    private readonly businesses: BusinessRepository,
    private readonly clock: Clock,
  ) {}

  findByContact(channel: ContactChannel, contact: string): Promise<Business | null> {
    return this.businesses.findByContact(channel, contact);
  }

  create(input: NewBusinessInput): Promise<Business> {
    return this.businesses.createWithDefaultRule(input);
  }

  async getById(id: string): Promise<Business> {
    const business = await this.businesses.findById(id);
    if (!business) throw new AppError('NOT_FOUND', 'Business not found');
    return business;
  }

  async update(id: string, patch: BusinessUpdate): Promise<Business> {
    await this.getById(id);
    return this.businesses.update(id, patch);
  }

  async usage(id: string): Promise<BusinessUsageDto> {
    const business = await this.getById(id);
    return {
      plan: business.plan,
      customerCount: await this.businesses.countActiveCustomers(id),
      maxCustomers: PLAN_LIMITS[business.plan].maxCustomers,
      upgradeRequestedAt: business.planUpgradeRequestedAt?.toISOString() ?? null,
    };
  }

  async requestUpgrade(id: string): Promise<void> {
    await this.getById(id);
    await this.businesses.markUpgradeRequested(id, this.clock.now());
  }
}
