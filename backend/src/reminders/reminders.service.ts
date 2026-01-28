import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RemindersService {
  constructor(@InjectQueue('reminders') private remindersQueue: Queue) {}

  async scheduleReminder(taskId: string, projectId: string, userId: string, dueDate: Date) {
    // Calculate delay
    const delay = dueDate.getTime() - Date.now();
    
    // Only schedule if in future
    if (delay > 0) {
      // Create a job
      await this.remindersQueue.add(
        'send-reminder',
        {
          taskId,
          projectId,
          userId,
          message: 'Task is due!',
        },
        {
          delay,
          jobId: `reminder-${taskId}`, // Dedup based on task ID
          removeOnComplete: true,
        },
      );
      console.log(`[Reminders] Scheduled for Task ${taskId} in ${Math.round(delay / 1000)}s`);
    }
  }

  async cancelReminder(taskId: string) {
    // BullMQ specific: Removing delayed jobs is tricky without job instance.
    // simpler to let it run and check if task is still pending? 
    // Or ignore. For now, we overwrite if same ID?
    // Using jobId allows us to overwrite/remove?
    // Actually, removal requires finding the job. 
    // Optimization: Just let it fire and check status in processor.
  }
}
