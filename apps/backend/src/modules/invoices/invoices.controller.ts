import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { InvoicesService } from './invoices.service.js';

export interface RecordCashDto {
  amount?: number;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post(':id/cash-payment')
  recordCash(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
    @Body() body?: RecordCashDto,
  ): Promise<InvoiceSummaryDto> {
    return this.invoices.recordCash(businessId, id, body?.amount);
  }
}
