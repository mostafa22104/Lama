import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import type { BusinessDto, BusinessUsageDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toBusinessDto } from './business.mapper.js';
import { BusinessService } from './business.service.js';
import { UpdateBusinessDto } from './dto/update-business.dto.js';

@Controller('business')
@UseGuards(JwtAuthGuard)
export class BusinessController {
  constructor(private readonly businesses: BusinessService) {}

  @Get()
  async get(@CurrentBusinessId() businessId: string): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.getById(businessId));
  }

  @Patch()
  async update(@CurrentBusinessId() businessId: string, @Body() dto: UpdateBusinessDto): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.update(businessId, dto));
  }

  @Get('usage')
  usage(@CurrentBusinessId() businessId: string): Promise<BusinessUsageDto> {
    return this.businesses.usage(businessId);
  }

  @Post('upgrade-request')
  @HttpCode(204)
  async requestUpgrade(@CurrentBusinessId() businessId: string): Promise<void> {
    await this.businesses.requestUpgrade(businessId);
  }
}
