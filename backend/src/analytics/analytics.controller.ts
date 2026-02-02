import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
// @Roles('ADMIN') // Temporarily disabled for demo
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dau')
  async getDailyActiveUsers(@Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getDailyActiveUsers(daysNum);
  }

  @Get('tasks/completion')
  async getTaskCompletionRate(@Query('projectId') projectId?: string) {
    return this.analyticsService.getTaskCompletionRate(projectId);
  }

  @Get('automation/executions')
  async getAutomationExecutions() {
    return this.analyticsService.getAutomationExecutionCount();
  }
}
