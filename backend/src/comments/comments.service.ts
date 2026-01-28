import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: string) {
    // Validate that the task exists
    const task = await this.prisma.task.findUnique({
      where: { id: createCommentDto.task_id },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        task_id: createCommentDto.task_id,
        user_id: userId,
        content: createCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await this.activityLog.logCommentAdded(userId, comment.id, createCommentDto.task_id);

    return comment;
  }

  // Get all comments for a specific task
  findAllByTask(taskId: string) {
    return this.prisma.comment.findMany({
      where: { task_id: taskId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    // Verify the comment exists and belongs to the user
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new NotFoundException('You can only update your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity (optional, using general log)
    await this.activityLog.log(userId, 'UPDATED', 'COMMENT', id, updateCommentDto);

    return updatedComment;
  }

  async remove(id: string, userId: string) {
    // Verify the comment exists and belongs to the user
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new NotFoundException('You can only delete your own comments');
    }

    const deletedComment = await this.prisma.comment.delete({
      where: { id },
    });

    // Log activity
    await this.activityLog.log(userId, 'DELETED', 'COMMENT', id, { task_id: comment.task_id });

    return deletedComment;
  }
}
