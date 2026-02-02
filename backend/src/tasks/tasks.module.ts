import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';
import { TaskRoleGuard } from '../auth/guards/task-role.guard';

import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [PrismaModule, AutomationModule],
  controllers: [TasksController],
  providers: [
    TasksService,
    ProjectRoleGuard,
    TaskRoleGuard,
  ],
})
export class TasksModule {}
