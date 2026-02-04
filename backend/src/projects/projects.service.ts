
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

import { ProjectMember } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private mailService: MailService,
  ) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    // 1. Create Project
    const project = await this.prisma.project.create({
      data: {
        name: createProjectDto.name,
        owner_id: userId,
      },
    });

    // 2. Add Owner as Member with OWNER role
    await this.prisma.projectMember.create({
      data: {
        project_id: project.id,
        user_id: userId,
        role: createProjectDto.userRole || 'OWNER',
      },
    });

    // 3. Log activity
    await this.activityLog.logProjectCreated(userId, project.id, project.name);

    return project;
  }

  findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        members: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.project.findUnique({
      where: { id },
      include: {
        tasks: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, updateProjectDto: UpdateProjectDto, userId: string) {
    const updated = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });

    // Log activity
    await this.activityLog.logProjectUpdated(userId, id, updateProjectDto);

    return updated;
  }

  async remove(id: string, userId: string) {
    // Get project name before deleting
    const project = await this.prisma.project.findUnique({ where: { id } });
    
    const deleted = await this.prisma.project.delete({
      where: { id },
    });

    // Log activity
    if (project) {
      await this.activityLog.logProjectDeleted(userId, id, project.name);
    }

    return deleted;
  }

  // ==================== MEMBER MANAGEMENT ====================

  async addMember(projectId: string, addMemberDto: AddMemberDto, actorId: string) {
    // 1. Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: addMemberDto.user_id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 3. Check if user is already a member
    const existingMember = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: addMemberDto.user_id,
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    // 4. Add member
    const member = await this.prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: addMemberDto.user_id,
        role: addMemberDto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // 5. Log activity
    await this.activityLog.logMemberAdded(actorId, projectId, member.id, addMemberDto.role);

    return member;
  }

  async removeMember(projectId: string, userId: string, actorId: string) {
    // 1. Find the membership
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found in this project');
    }

    // 2. Prevent removing the owner
    if (membership.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    // 3. Remove the member
    await this.prisma.projectMember.delete({
      where: { id: membership.id },
    });

    // 4. Log activity
    await this.activityLog.logMemberRemoved(actorId, projectId, membership.id);

    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(projectId: string, userId: string, updateMemberRoleDto: UpdateMemberRoleDto, actorId: string) {
    // 1. Find the membership
    const membership = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: userId,
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found in this project');
    }

    // 2. Prevent changing owner role
    if (membership.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the role of the project owner');
    }

    // 3. Update the role
    const updatedMember = await this.prisma.projectMember.update({
      where: { id: membership.id },
      data: { role: updateMemberRoleDto.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // 4. Log activity
    await this.activityLog.logRoleChanged(
      actorId,
      projectId,
      membership.id,
      membership.role,
      updateMemberRoleDto.role,
    );

    return updatedMember;
  }

  async getMembers(projectId: string) {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get all members
    const members = await this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true, // Included for frontend
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then EDITOR, then VIEWER
        { joined_at: 'asc' },
      ],
    });

    return members;
  }

  async inviteMember(projectId: string, email: string, role: 'OWNER' | 'EDITOR' | 'VIEWER', actorId: string) {
    // 1. Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. Find user by email (For now, strict mode: User must exist)
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found. They must register first.');
    }

    // 3. Check if already a member
    const existingMember = await this.prisma.projectMember.findFirst({
      where: {
        project_id: projectId,
        user_id: user.id,
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this project');
    }

    // 4. Add member
    const member = await this.prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: user.id,
        role: role,
      },
      include: {
        user: {
           select: { name: true, email: true }
        }
      }
    });

    // 5. Log activity
    await this.activityLog.logMemberAdded(actorId, projectId, member.id, role);

    // 6. Send Email
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    
    await this.mailService.sendProjectInvitation(
        email, 
        project.name, 
        role, 
        actor ? actor.name : 'A Team Member'
    );
    
    return member;
  }
}
