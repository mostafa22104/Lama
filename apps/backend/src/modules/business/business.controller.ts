import { Controller, Get, UseGuards } from '@nestjs/common';
import type { BusinessDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toBusinessDto } from './business.mapper.js';
import { BusinessService } from './business.service.js';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}

  @Get()
  async get(@CurrentBusinessId() businessId: string): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.getById(businessId));
  }
}
