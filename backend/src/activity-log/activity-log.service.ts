import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';

export enum ActivityAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  ASSIGNED = 'ASSIGNED',
  COMMENTED = 'COMMENTED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  MEMBER_ADDED = 'MEMBER_ADDED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  ROLE_CHANGED = 'ROLE_CHANGED',
}

export enum EntityType {
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  COMMENT = 'COMMENT',
  MEMBER = 'MEMBER',
}

@Injectable()
export class ActivityLogService {
  constructor(
    private prisma: PrismaService,
    private automationService: AutomationService
  ) {}

  /**
   * Log an activity
   */
  async log(
    userId: string,
    action: ActivityAction | string,
    entityType: EntityType | string,
    entityId: string,
    metadata?: Record<string, any>,
  ) {
    const activityData: any = {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
    };

    // If metadata is provided, store it as JSON string in action field
    if (metadata) {
      activityData.action = `${action}:${JSON.stringify(metadata)}`;
    }

    // 1. Create standard ActivityLog
    const log = await this.prisma.activityLog.create({
      data: activityData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // 2. Create Event for Analytics & Automation
    // We map ActivityAction to Event Type
    const eventType = `${entityType}_${action}`; // e.g., TASK_CREATED
    
    try {
        const event = await this.prisma.event.create({
            data: {
                userId,
                type: eventType,
                metadata: metadata || {},
                createdAt: new Date(),
            }
        });

        // 3. Trigger Automation Rules
        // We do this asynchronously to not block the main flow
        this.automationService.processEvent(event).catch(err => {
            console.error('Failed to process automation rules', err);
        });

    } catch (e) {
        console.error('Failed to create analytics event', e);
    }

    return log;
  }

  /**
   * Get all activities (admin only)
   */
  async findAll(limit = 50) {
    return this.prisma.activityLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Get activities for a specific user
   */
  async findByUser(userId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: { user_id: userId },
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Get activities for a specific project
   */
  async findByProject(projectId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: {
        entity_type: EntityType.PROJECT,
        entity_id: projectId,
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Get activities for a specific task
   */
  async findByTask(taskId: string, limit = 50) {
    return this.prisma.activityLog.findMany({
      where: {
        entity_type: EntityType.TASK,
        entity_id: taskId,
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Get recent activities (dashboard feed)
   */
  async getRecentActivities(userId: string, limit = 20) {
    // Get user's projects
    const userProjects = await this.prisma.projectMember.findMany({
      where: { user_id: userId },
      select: { project_id: true },
    });

    const projectIds = userProjects.map((pm) => pm.project_id);

    // Get activities from user's projects
    return this.prisma.activityLog.findMany({
      where: {
        OR: [
          { user_id: userId }, // User's own activities
          {
            entity_type: EntityType.PROJECT,
            entity_id: { in: projectIds },
          }, // Activities in user's projects
        ],
      },
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Helper methods for common activities
   */

  async logProjectCreated(userId: string, projectId: string, projectName: string) {
    return this.log(userId, ActivityAction.CREATED, EntityType.PROJECT, projectId, {
      name: projectName,
    });
  }

  async logProjectUpdated(userId: string, projectId: string, changes: any) {
    return this.log(userId, ActivityAction.UPDATED, EntityType.PROJECT, projectId, changes);
  }

  async logProjectDeleted(userId: string, projectId: string, projectName: string) {
    return this.log(userId, ActivityAction.DELETED, EntityType.PROJECT, projectId, {
      name: projectName,
    });
  }

  async logTaskCreated(userId: string, taskId: string, taskTitle: string) {
    return this.log(userId, ActivityAction.CREATED, EntityType.TASK, taskId, {
      title: taskTitle,
    });
  }

  async logTaskUpdated(userId: string, taskId: string, changes: any) {
    return this.log(userId, ActivityAction.UPDATED, EntityType.TASK, taskId, changes);
  }

  async logTaskDeleted(userId: string, taskId: string, taskTitle: string) {
    return this.log(userId, ActivityAction.DELETED, EntityType.TASK, taskId, {
      title: taskTitle,
    });
  }

  async logTaskStatusChanged(
    userId: string,
    taskId: string,
    oldStatus: string,
    newStatus: string,
  ) {
    return this.log(userId, ActivityAction.STATUS_CHANGED, EntityType.TASK, taskId, {
      from: oldStatus,
      to: newStatus,
    });
  }

  async logTaskAssigned(userId: string, taskId: string, assigneeId: string) {
    return this.log(userId, ActivityAction.ASSIGNED, EntityType.TASK, taskId, {
      assignee_id: assigneeId,
    });
  }

  async logCommentAdded(userId: string, commentId: string, taskId: string) {
    return this.log(userId, ActivityAction.COMMENTED, EntityType.COMMENT, commentId, {
      task_id: taskId,
    });
  }

  async logMemberAdded(userId: string, projectId: string, memberId: string, role: string) {
    return this.log(userId, ActivityAction.MEMBER_ADDED, EntityType.MEMBER, memberId, {
      project_id: projectId,
      role,
    });
  }

  async logMemberRemoved(userId: string, projectId: string, memberId: string) {
    return this.log(userId, ActivityAction.MEMBER_REMOVED, EntityType.MEMBER, memberId, {
      project_id: projectId,
    });
  }

  async logRoleChanged(
    userId: string,
    projectId: string,
    memberId: string,
    oldRole: string,
    newRole: string,
  ) {
    return this.log(userId, ActivityAction.ROLE_CHANGED, EntityType.MEMBER, memberId, {
      project_id: projectId,
      from: oldRole,
      to: newRole,
    });
  }
}
