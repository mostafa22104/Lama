import { Body, Controller, Delete, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { CustomerDto, CustomersBatchResult } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { toCustomerDto } from './customer.mapper.js';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { CreateCustomersBatchDto } from './dto/create-customers-batch.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Post()
  async create(@CurrentBusinessId() businessId: string, @Body() dto: CreateCustomerDto): Promise<CustomerDto> {
    return toCustomerDto(await this.customers.create(businessId, dto));
  }

  @Post('batch')
  async createBatch(
    @CurrentBusinessId() businessId: string,
    @Body() dto: CreateCustomersBatchDto,
  ): Promise<CustomersBatchResult> {
    const created = await this.customers.createMany(businessId, dto.customers);
    return { created: created.map(toCustomerDto) };
  }

  @Patch(':id')
  async update(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerDto> {
    return toCustomerDto(await this.customers.update(businessId, id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  async archive(@CurrentBusinessId() businessId: string, @Param('id') id: string): Promise<void> {
    await this.customers.archive(businessId, id);
  }
}
