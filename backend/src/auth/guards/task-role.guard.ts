import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRole } from '@prisma/client';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';

@Injectable()
export class TaskRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(PROJECT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No specific roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get Task ID from params
    const taskId = request.params.id;

    if (!taskId) {
      throw new ForbiddenException('Task ID not provided');
    }

    // Find the task to get the project_id
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { project_id: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const projectId = task.project_id;

    // Get user's membership in the project
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: user.userId,
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    // Check if user has one of the required roles
    const hasRequiredRole = requiredRoles.some((role) => membership.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `This action requires one of the following roles: ${requiredRoles.join(', ')}`,
      );
    }

    // Attach membership to request for later use
    request.projectMembership = membership;

    return true;
  }
}
