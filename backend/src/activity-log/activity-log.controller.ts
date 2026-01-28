import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.findAll(limitNum);
  }

  @Get('me')
  getMyActivities(@User() user: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.findByUser(user.userId, limitNum);
  }

  @Get('recent')
  getRecentActivities(@User() user: any, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.activityLogService.getRecentActivities(user.userId, limitNum);
  }

  @Get('user/:userId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findByUser(@Param('userId') userId: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.findByUser(userId, limitNum);
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.findByProject(projectId, limitNum);
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.activityLogService.findByTask(taskId, limitNum);
  }
}
