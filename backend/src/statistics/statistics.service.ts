import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    // 1. Get total projects count
    const totalProjects = await this.prisma.projectMember.count({
      where: { user_id: userId },
    });

    // 2. Get task stats (assigned to user)
    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: {
        assignee_id: userId,
      },
      _count: {
        status: true,
      },
    });

    // Process task stats
    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;
    let inProgressTasks = 0;

    const statusDistribution = {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    taskStats.forEach((stat) => {
      const count = stat._count.status;
      totalTasks += count;
      
      statusDistribution[stat.status] = count;

      if (stat.status === 'DONE') {
        completedTasks += count;
      } else {
        pendingTasks += count;
        if (stat.status === 'IN_PROGRESS') {
          inProgressTasks += count;
        }
      }
    });

    // 3. Get tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await this.prisma.task.count({
      where: {
        assignee_id: userId,
        status: { not: 'DONE' },
        due_date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 4. Overdue tasks
    const overdueTasks = await this.prisma.task.count({
      where: {
        assignee_id: userId,
        status: { not: 'DONE' },
        due_date: {
          not: null, // Ensure we don't count valid date < today if null behaves weirdly
          lt: today,
        },
      },
    });

    // 5. Tasks by Priority
    const priorityStats = await this.prisma.task.groupBy({
      by: ['priority'],
      where: { assignee_id: userId },
      _count: { priority: true },
    });

    const priorityDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    priorityStats.forEach((stat) => {
      priorityDistribution[stat.priority] = stat._count.priority;
    });

    return {
      overview: {
        total_projects: totalProjects,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        in_progress_tasks: inProgressTasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      attention_needed: {
        due_today: tasksDueToday,
        overdue: overdueTasks,
      },
      distributions: {
        status: statusDistribution,
        priority: priorityDistribution,
      },
    };
  }

  async getProjectStats(projectId: string) {
    // 1. Task Status Distribution
    const taskStats = await this.prisma.task.groupBy({
      by: ['status'],
      where: { project_id: projectId },
      _count: { status: true },
    });

    let totalTasks = 0;
    let completedTasks = 0;
    const statusDistribution = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };

    taskStats.forEach((stat) => {
      const count = stat._count.status;
      totalTasks += count;
      statusDistribution[stat.status] = count;
      if (stat.status === 'DONE') completedTasks += count;
    });

    // 2. Member contributions (who completed most tasks)
    const memberStats = await this.prisma.task.groupBy({
      by: ['assignee_id'],
      where: { 
        project_id: projectId,
        status: 'DONE'
      },
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' }
      }
    });

    // Limit to top 5 performers with valid assignee_id
    const validMemberStats = memberStats
      .filter((stat) => stat.assignee_id !== null)
      .slice(0, 5);

    // Fetch user details for top members
    const topPerformers = await Promise.all(
      validMemberStats.map(async (stat) => {
        const user = await this.prisma.user.findUnique({
          where: { id: stat.assignee_id as string },
          select: { id: true, name: true, email: true }
        });
        return {
          user,
          completed_tasks: stat._count.id
        };
      })
    );

    return {
      completion: {
        total: totalTasks,
        completed: completedTasks,
        remaining: totalTasks - completedTasks,
        percent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      distribution: statusDistribution,
      top_performers: topPerformers,
    };
  }
}
