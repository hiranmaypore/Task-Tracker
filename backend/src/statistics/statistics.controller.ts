import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectMemberGuard } from '../auth/guards/project-member.guard';
import { User } from '../auth/user.decorator';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  getDashboardStats(@User() user: any) {
    return this.statisticsService.getDashboardStats(user.userId);
  }

  @Get('project/:id')
  @UseGuards(ProjectMemberGuard) // Ensure user is a member
  getProjectStats(@Param('id') projectId: string) {
    return this.statisticsService.getProjectStats(projectId);
  }
}
