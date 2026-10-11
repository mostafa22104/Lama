import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { ChargeDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toChargeDto } from './charge.mapper.js';
import { ChargesService } from './charges.service.js';
import { CreateChargeDto } from './dto/create-charge.dto.js';
import { UpdateChargeDto } from './dto/update-charge.dto.js';

@Controller('charges')
@UseGuards(JwtAuthGuard)
export class ChargesController {
  constructor(private readonly charges: ChargesService) {}

  @Post()
  async create(@CurrentBusinessId() businessId: string, @Body() dto: CreateChargeDto): Promise<ChargeDto> {
    return toChargeDto(await this.charges.create(businessId, dto));
  }

  @Get()
  async list(@CurrentBusinessId() businessId: string): Promise<ChargeDto[]> {
    return (await this.charges.list(businessId)).map(toChargeDto);
  }

  @Patch(':id')
  async update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateChargeDto,
  ): Promise<ChargeDto> {
    return toChargeDto(await this.charges.update(businessId, id, dto));
  }
}
