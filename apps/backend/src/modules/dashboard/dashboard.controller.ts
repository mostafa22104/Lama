import { Controller, Get, UseGuards } from '@nestjs/common';
import type { HomeDashboardDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { DashboardService } from './dashboard.service.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('home')
  home(@CurrentBusinessId() businessId: string): Promise<HomeDashboardDto> {
    return this.dashboard.home(businessId);
  }
}
