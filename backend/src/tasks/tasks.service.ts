
import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common'; 
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { EventsGateway } from '../events/events.gateway';
import { RemindersService } from '../reminders/reminders.service';
import { MailService } from '../mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as cacheManager_1 from 'cache-manager';

import { AutomationService } from '../automation/automation.service';
import { CalendarService } from '../calendar/calendar.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private eventsGateway: EventsGateway,
    private remindersService: RemindersService,
    private mailService: MailService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager_1.Cache,
    private automationService: AutomationService,
    private calendarService: CalendarService,
    private notificationsService: NotificationsService,
  ) {}

  private async invalidateUserCache(userId: string) {
    try {
        const store = (this.cacheManager as any).store;
        if (store.keys) {
            const keys = await store.keys(`tasks:${userId}:*`);
            if (keys && keys.length > 0) {
                // cache-manager v5 del accepts array? check types. usually manual loop.
                for (const key of keys) {
                    await this.cacheManager.del(key);
                }
            }
        }
    } catch (e) {
        console.error('Cache invalidation failed', e);
    }
  }

  async create(createTaskDto: CreateTaskDto, userId: string) {
    // ... (existing code checks)
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.project_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (createTaskDto.parent_task_id) {
       const parentTask = await this.prisma.task.findUnique({ where: { id: createTaskDto.parent_task_id } });
       if (!parentTask) throw new NotFoundException('Parent task not found');
       if (parentTask.project_id !== createTaskDto.project_id) throw new BadRequestException('Subtask mismatch');
    }

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || 'TODO',
        priority: createTaskDto.priority || 'MEDIUM',
        due_date: createTaskDto.due_date ? new Date(createTaskDto.due_date) : null,
        project_id: createTaskDto.project_id,
        assignee_id: createTaskDto.assignee_id || userId,
        parent_task_id: createTaskDto.parent_task_id,
      },
      include: {
        project: true,
        assignee: true,
      },
    });

    // Calendar Sync (only if user has calendar connected)
    if (task.due_date) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { calendarSyncEnabled: true, googleAccessToken: true }
            });
            
            if (user?.calendarSyncEnabled && user?.googleAccessToken) {
                const { eventId } = await this.calendarService.syncTaskToCalendar(userId, task.id);
                if (eventId) {
                   await this.prisma.task.update({
                       where: { id: task.id },
                       data: { googleEventId: eventId }
                   });
                }
            }
        } catch (e) {
            console.warn(`Calendar sync failed for task ${task.id}: ${e.message}`);
        }
    }

    await this.activityLog.logTaskCreated(userId, task.id, task.title);
    this.eventsGateway.emitTaskCreated(task.project_id, task);

    if (task.due_date) {
      await this.remindersService.scheduleReminder(task.id, task.project_id, userId, task.due_date);
    }

    if (task.assignee && task.assignee.email) {
       await this.mailService.sendTaskAssignedEmail(userId, task.assignee.email, task.title, task.project.name);
    }

    // TRIGGER AUTOMATION
    this.automationService.processEvent({
      type: 'TASK_CREATED',
      userId: userId,
      taskId: task.id,
      task: task,
      metadata: {
        priority: task.priority,
        status: task.status,
        projectId: task.project_id
      }
    });

    await this.invalidateUserCache(userId);
    if (task.assignee_id && task.assignee_id !== userId) {
        await this.invalidateUserCache(task.assignee_id);
    }

    return task;
  }

  async findAll(userId: string, filterDto?: FilterTaskDto) {
    const cacheKey = `tasks:${userId}:${JSON.stringify(filterDto || {})}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
        return cached;
    }

    const where: any = {
      OR: [
        { assignee_id: userId },
        {
          project: {
            members: {
              some: {
                user_id: userId,
              },
            },
          },
        },
      ],
    };

    // Apply filters
    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

    if (filterDto?.project_id && isValidObjectId(filterDto.project_id)) {
      where.project_id = filterDto.project_id;
    }

    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    if (filterDto?.priority) {
      where.priority = filterDto.priority;
    }

    if (filterDto?.assignee_id && isValidObjectId(filterDto.assignee_id)) {
      where.assignee_id = filterDto.assignee_id;
    }

    if (filterDto?.search) {
      where.OR = [
        { title: { contains: filterDto.search, mode: 'insensitive' } },
        { description: { contains: filterDto.search, mode: 'insensitive' } },
      ];
    }

    const tasks = await this.prisma.task.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    await this.cacheManager.set(cacheKey, tasks, 60000); // 60s
    return tasks;
  }

  findOne(id: string) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new NotFoundException('Invalid task ID format');
    return this.prisma.task.findUnique({
      where: { id },
      include: { subtasks: true },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new NotFoundException('Invalid task ID format');
    // 1. Get old task for logging
    const oldTask = await this.prisma.task.findUnique({ where: { id } });
    if (!oldTask) throw new NotFoundException('Task not found');

    // 2. Perform update
    const updateData: any = { ...updateTaskDto };
    
    // Convert empty strings to null for MongoDB ObjectId fields
    if (updateData.assignee_id === "") updateData.assignee_id = null;
    if (updateData.parent_task_id === "") updateData.parent_task_id = null;
    if (updateData.project_id === "") delete updateData.project_id; // Don't allow clearing project_id to empty

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
         ...updateData,
         due_date: updateTaskDto.due_date === null ? null : (updateTaskDto.due_date ? new Date(updateTaskDto.due_date) : undefined)
      },
      include: {
        project: true,
        assignee: true,
      }
    });

    // ... (rest of update logic)
    // Calendar Sync (if title, desc, status, priority, or date changed and user has calendar connected)
    if (updatedTask.due_date && (
        updateTaskDto.title || 
        updateTaskDto.description || 
        updateTaskDto.due_date || 
        updateTaskDto.priority ||
        updateTaskDto.status
    )) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { calendarSyncEnabled: true, googleAccessToken: true }
            });
            
            if (user?.calendarSyncEnabled && user?.googleAccessToken) {
                await this.calendarService.syncTaskToCalendar(userId, updatedTask.id);
            }
        } catch (e) {
             console.warn(`Calendar sync failed for task ${updatedTask.id}: ${e.message}`);
        }
    }

    if (updateTaskDto.due_date) {
      const date = new Date(updateTaskDto.due_date);
      await this.remindersService.scheduleReminder(updatedTask.id, updatedTask.project_id, userId, date);
    }

    // Email if assignee changed
    if (updateTaskDto.assignee_id && updateTaskDto.assignee_id !== oldTask.assignee_id) {
       if (updatedTask.assignee && updatedTask.assignee.email) {
          await this.mailService.sendTaskAssignedEmail(userId, updatedTask.assignee.email, updatedTask.title, updatedTask.project.name);
       }
    }

    // 3. Log specific activities if needed
    if (updateTaskDto.status && updateTaskDto.status !== oldTask.status) {
       await this.activityLog.logTaskStatusChanged(userId, id, oldTask.status, updateTaskDto.status);
       
       // Create Notification
       const message = `Task "${oldTask.title}" status changed to ${updateTaskDto.status}`;
       await this.notificationsService.create(userId, "Task Updated", message, "INFO");
    }

    if (updateTaskDto.assignee_id && updateTaskDto.assignee_id !== oldTask.assignee_id) {
       await this.activityLog.logTaskAssigned(userId, id, updateTaskDto.assignee_id);
    }

    // Always log a general update
    await this.activityLog.logTaskUpdated(userId, id, updateTaskDto);

    // Emit Event
    this.eventsGateway.emitTaskUpdated(updatedTask.project_id, updatedTask);

    // TRIGGER AUTOMATION
    if (updateTaskDto.status === 'DONE' && oldTask.status !== 'DONE') {
         this.automationService.processEvent({
            type: 'TASK_COMPLETED',
            userId: userId,
            taskId: updatedTask.id,
            task: updatedTask,
            metadata: {
              priority: updatedTask.priority,
              status: updatedTask.status,
              projectId: updatedTask.project_id
            }
         });
    }

    // Invalidate
    await this.invalidateUserCache(userId);
    // Also invalidate assignee if different
    if (updatedTask.assignee_id && updatedTask.assignee_id !== userId) {
        await this.invalidateUserCache(updatedTask.assignee_id);
    }
    if (oldTask.assignee_id && oldTask.assignee_id !== userId && oldTask.assignee_id !== updatedTask.assignee_id) {
        await this.invalidateUserCache(oldTask.assignee_id);
    }

    return updatedTask;
  }

  async remove(id: string, userId: string) {
    if (!/^[a-f\d]{24}$/i.test(id)) throw new NotFoundException('Invalid task ID format');
    console.log(`[DELETE] Starting delete for task ${id} by user ${userId}`);
    
    // First, check if task exists
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        subtasks: true,
        comments: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    console.log(`[DELETE] Found task with ${task.comments.length} comments and ${task.subtasks.length} subtasks`);

    // Delete all comments associated with this task
    if (task.comments.length > 0) {
      console.log(`[DELETE] Deleting ${task.comments.length} comments for task ${id}`);
      const deleteResult = await this.prisma.comment.deleteMany({
        where: { task_id: id },
      });
      console.log(`[DELETE] Deleted ${deleteResult.count} comments`);
    }

    // Delete all subtasks
    if (task.subtasks.length > 0) {
      console.log(`[DELETE] Deleting ${task.subtasks.length} subtasks`);
      await this.prisma.task.deleteMany({
        where: { parent_task_id: id },
      });
    }

    // Finally, delete the task itself
    const deletedTask = await this.prisma.task.delete({
      where: { id },
    });

    console.log(`[DELETE] Task ${id} deleted successfully`);

    // Log activity
    await this.activityLog.logTaskDeleted(userId, id, task.title);

    // Emit Event
    this.eventsGateway.emitTaskDeleted(task.project_id, id, task);

    // Invalidate
    await this.invalidateUserCache(userId);
    if (task.assignee_id && task.assignee_id !== userId) {
        await this.invalidateUserCache(task.assignee_id);
    }

    return deletedTask;
  }
}
