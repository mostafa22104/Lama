import { Injectable } from '@nestjs/common';
import type { ContactChannel } from '@lamma/shared';
import { AppError } from '../../common/errors/app-error.js';
import type { Business } from '../../generated/prisma/client.js';
import { BusinessRepository } from './business.repository.js';
import type { NewBusinessInput } from './business.types.js';

@Injectable()
export class BusinessService {
  constructor(private readonly businesses: BusinessRepository) {}

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
}
