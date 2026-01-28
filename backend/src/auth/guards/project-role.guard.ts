import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectRole } from '@prisma/client';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
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
      return true; // No specific project roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get project ID from params or body
    const projectId = request.params.id || request.params.projectId || request.body.project_id;

    if (!projectId) {
      throw new ForbiddenException('Project ID not provided');
    }

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
