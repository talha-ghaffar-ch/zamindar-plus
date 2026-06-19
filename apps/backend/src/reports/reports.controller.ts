import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user-id.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary(@CurrentUserId() userId: string) {
    return this.reportsService.getSummary(userId);
  }

  @Get('crop-profitability')
  getCropProfitability(@CurrentUserId() userId: string) {
    return this.reportsService.getCropProfitability(userId);
  }

  @Get('monthly-summary')
  getMonthlySummary(@CurrentUserId() userId: string) {
    return this.reportsService.getMonthlySummary(userId);
  }
}
