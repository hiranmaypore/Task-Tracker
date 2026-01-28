import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectOwnerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get project ID from params
    const projectId = request.params.id || request.params.projectId;

    if (!projectId) {
      throw new ForbiddenException('Project ID not provided');
    }

    // Check if user is the owner of the project
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: user.userId,
        role: 'OWNER',
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only project owner can perform this action');
    }

    return true;
  }
}
