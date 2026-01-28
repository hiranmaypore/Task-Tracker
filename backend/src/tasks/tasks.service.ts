
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

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
    private eventsGateway: EventsGateway,
    private remindersService: RemindersService,
    private mailService: MailService,
    @Inject(CACHE_MANAGER) private cacheManager: cacheManager_1.Cache,
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
    // 1. Validate that the project exists
    const project = await this.prisma.project.findUnique({
      where: { id: createTaskDto.project_id },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // 2. If subtask, validate parent
    if (createTaskDto.parent_task_id) {
      const parentTask = await this.prisma.task.findUnique({
        where: { id: createTaskDto.parent_task_id },
      });

      if (!parentTask) {
        throw new NotFoundException('Parent task not found');
      }

      if (parentTask.project_id !== createTaskDto.project_id) { 
           throw new BadRequestException('Subtask must belong to the same project as parent task');
      }
    }

    // 3. Create Task
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

    // 4. Log activity
    await this.activityLog.logTaskCreated(userId, task.id, task.title);

    // 5. Emit Event
    this.eventsGateway.emitTaskCreated(task.project_id, task);

    // 6. Schedule Reminder
    if (task.due_date) {
      await this.remindersService.scheduleReminder(task.id, task.project_id, userId, task.due_date);
    }

    // 7. Send Email
    if (task.assignee && task.assignee.email) {
       await this.mailService.sendTaskAssignedEmail(userId, task.assignee.email, task.title, task.project.name);
    }

    // 8. Invalidate Cache
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
    if (filterDto?.project_id) {
      where.project_id = filterDto.project_id;
    }

    if (filterDto?.status) {
      where.status = filterDto.status;
    }

    if (filterDto?.priority) {
      where.priority = filterDto.priority;
    }

    if (filterDto?.assignee_id) {
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
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    await this.cacheManager.set(cacheKey, tasks, 60000); // 60s
    return tasks;
  }

  findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { subtasks: true },
    });
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    // 1. Get old task for logging
    const oldTask = await this.prisma.task.findUnique({ where: { id } });
    if (!oldTask) throw new NotFoundException('Task not found');

    // 2. Perform update
    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
         ...updateTaskDto,
         due_date: updateTaskDto.due_date ? new Date(updateTaskDto.due_date) : undefined
      },
      include: {
        project: true,
        assignee: true,
      }
    });

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
    }

    if (updateTaskDto.assignee_id && updateTaskDto.assignee_id !== oldTask.assignee_id) {
       await this.activityLog.logTaskAssigned(userId, id, updateTaskDto.assignee_id);
    }

    // Always log a general update
    await this.activityLog.logTaskUpdated(userId, id, updateTaskDto);

    // Emit Event
    this.eventsGateway.emitTaskUpdated(updatedTask.project_id, updatedTask);

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

    // Delete all comments associated with this task
    if (task.comments.length > 0) {
      await this.prisma.comment.deleteMany({
        where: { task_id: id },
      });
    }

    // Delete all subtasks
    if (task.subtasks.length > 0) {
      await this.prisma.task.deleteMany({
        where: { parent_task_id: id },
      });
    }

    // Finally, delete the task itself
    const deletedTask = await this.prisma.task.delete({
      where: { id },
    });

    // Log activity
    await this.activityLog.logTaskDeleted(userId, id, task.title);

    // Emit Event
    this.eventsGateway.emitTaskDeleted(task.project_id, id);

    // Invalidate
    await this.invalidateUserCache(userId);
    if (task.assignee_id && task.assignee_id !== userId) {
        await this.invalidateUserCache(task.assignee_id);
    }

    return deletedTask;
  }
}
