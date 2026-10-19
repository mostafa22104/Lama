import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { PaymentClaimItemDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('claims')
  listClaims(@CurrentBusinessId() businessId: string): Promise<PaymentClaimItemDto[]> {
    return this.service.listClaims(businessId);
  }

  @Post('claims/:id/confirm')
  confirmClaim(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.service.confirm(businessId, id);
  }

  @Post('claims/:id/reject')
  rejectClaim(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.service.reject(businessId, id);
  }

  @Post('claims/:id/undo')
  undoClaim(
    @CurrentBusinessId() businessId: string,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    return this.service.undo(businessId, id);
  }
}
