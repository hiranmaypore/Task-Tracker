import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectMemberGuard } from '../auth/guards/project-member.guard';
import { ProjectOwnerGuard } from '../auth/guards/project-owner.guard';
import { ProjectRoleGuard } from '../auth/guards/project-role.guard';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectMemberGuard,
    ProjectOwnerGuard,
    ProjectRoleGuard,
  ],
})
export class ProjectsModule {}
