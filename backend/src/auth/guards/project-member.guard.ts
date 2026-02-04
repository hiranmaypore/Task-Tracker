import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        
        if (!user) {
          throw new ForbiddenException('User not authenticated');
        }

        const projectId = request.params.id || request.params.projectId || request.body.project_id;

        if (!projectId) {
          // If no project ID, allow (will be validated elsewhere)
          return true;
        }

        // Validate if projectId is a valid format (optional but good)
        if (projectId.length !== 24) {
             // Invalid ID format for ObjectId
             return true; // Let the controller handle 404
        }

        // Check if user is a member of the project
        const membership = await this.prisma.projectMember.findFirst({
          where: {
            project_id: projectId,
            user_id: user.userId,
          },
        });

        if (!membership) {
          throw new ForbiddenException('You are not a member of this project');
        }

        // Attach membership to request for later use
        request.projectMembership = membership;

        return true;
    } catch (error) {
        console.error("Error in ProjectMemberGuard:", error);
        throw error;
    }
  }
}
