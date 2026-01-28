import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { EventsGateway } from '../events/events.gateway';
import { Logger } from '@nestjs/common';

@Processor('reminders')
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(private eventsGateway: EventsGateway) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing reminder for task ${job.data.taskId}`);
    
    // Emit WebSocket event to the Project Room (or User specific room if we had one)
    // For now, project room is fine.
    
    const notification = {
      type: 'REMINDER',
      message: `Task due now!`,
      taskId: job.data.taskId,
      projectId: job.data.projectId,
    };

    // We can emit to 'project_{id}'
    this.eventsGateway.server.to(`project_${job.data.projectId}`).emit('reminder', notification);
    
    // Also log?
    this.logger.log(`Notification sent for Task ${job.data.taskId}`);
  }
}
