import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { InvoiceSummaryDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { InvoicesService } from './invoices.service.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Post(':id/cash-payment')
  recordCash(@CurrentBusinessId() businessId: string, @Param('id') id: string): Promise<InvoiceSummaryDto> {
    return this.invoices.recordCash(businessId, id);
  }
}
