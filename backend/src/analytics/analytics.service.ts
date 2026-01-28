import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDailyActiveUsers(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Using Raw MongoDB Aggregation Pipeline as requested
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: { $date: startDate.toISOString() } },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          users: { $addToSet: '$userId' },
        },
      },
      {
        $project: {
          date: '$_id',
          count: { $size: '$users' },
          _id: 0,
        },
      },
      {
        $sort: { date: 1 },
      },
    ];

    try {
      // Execute raw command on the 'Event' collection
      // Note: Model name in Prisma is 'Event', but collection name is typically 'Event' or 'events' depending on mapping.
      // Prisma by default uses the model name unless @@map is used.
      // However, for $runCommandRaw, we specify the collection name in the 'aggregate' field.
      // Based on standard Prisma-Mongo mapping, it might be 'Event'.
      const result = await this.prisma.$runCommandRaw({
        aggregate: 'Event', 
        pipeline: pipeline,
        cursor: {},
      });

      // The result from runCommandRaw typically follows the Mongo shell output format: { ok: 1, cursor: { firstBatch: [...] } }
      // We need to parse strict JSON if it returns extended JSON types, but usually it returns POJO.
      return result;
    } catch (error) {
      console.error('Analytics Aggregation Failed:', error);
      // Fallback or rethrow
      throw error;
    }
  }

  async getTaskCompletionRate(projectId?: string) {
     // Example using Prisma's groupBy for comparison or hybrid approach
     const where: any = {};
     if (projectId) where.project_id = projectId;

     const stats = await this.prisma.task.groupBy({
         by: ['status'],
         where,
         _count: { status: true }
     });

     const total = stats.reduce((acc, curr) => acc + curr._count.status, 0);
     const completed = stats.find(s => s.status === 'DONE')?._count.status || 0;

     return {
         total,
         completed,
         rate: total > 0 ? (completed / total) * 100 : 0
     };
  }

  async getAutomationExecutionCount() {
      // Placeholder for Automation executions stats
      // Assuming we log automation executions to ActivityLog or Event
      // Here we can use the Event collection if we log type: 'AUTOMATION_EXECUTED'
      const count = await this.prisma.event.count({
          where: {
              type: 'AUTOMATION_EXECUTED'
          }
      });
      return { count };
  }
}
