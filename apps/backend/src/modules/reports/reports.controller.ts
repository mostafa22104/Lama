import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { MonthlyReportDto } from '@lamma/shared';
import { CurrentBusinessId } from '../../common/auth/current-business-id.decorator.js';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard.js';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto.js';
import { ReportsService } from './reports.service.js';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('monthly')
  monthly(@CurrentBusinessId() businessId: string, @Query() query: MonthlyReportQueryDto): Promise<MonthlyReportDto> {
    return this.reports.monthly(businessId, query.period);
  }
}
