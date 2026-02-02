import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('automation')
export class AutomationConsumer extends WorkerHost {
  private readonly logger = new Logger(AutomationConsumer.name);

  constructor(
    private mailService: MailService,
    private notificationsService: NotificationsService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { ruleId, userId, actions, eventData } = job.data;
    this.logger.log(`Executing actions for rule ${ruleId} job ${job.id}`);

    for (const action of actions) {
      try {
        await this.executeAction(action, userId, eventData);
      } catch (e) {
        this.logger.error(`Failed to execute action ${action}: ${e.message}`);
      }
    }
  }

  private async executeAction(action: string, userId: string, eventData: any) {
    const task = eventData.task;
    
    switch (action) {
      case 'EMAIL_ASSIGNEE':
        // Check if task has assignee info populated
        if (task && task.assignee && task.assignee.email) {
            await this.mailService.sendGenericEmail(
                task.assignee.email,
                `Automation: Task Action Required`,
                `This is an automated message triggered by rule for task: ${task.title}`
            );
            await this.notificationsService.create(
                task.assignee.id,
                `Automation Alert`,
                `Rule triggered for task "${task.title}". Check your email.`,
                'INFO'
            );
            this.logger.log(`Sent email to assignee ${task.assignee.email}`);
        } else {
            this.logger.warn(`Action EMAIL_ASSIGNEE failed: No assignee email found`);
        }
        break;

      case 'EMAIL_OWNER':
        // Assuming we have project owner info or fetch it. For now, sending to current user if they are owner?
        // Or if we have access to user email from eventData (which we do if passed)
        if (eventData.user && eventData.user.email) {
            await this.mailService.sendGenericEmail(
                eventData.user.email,
                `Automation: Rule Triggered`,
                `Your rule was triggered for task: ${task?.title}`
            );
            await this.notificationsService.create(
                userId, // userId of the rule owner
                `Automation Triggered`,
                `Your rule executed successfully for task "${task?.title}"`,
                'SUCCESS'
            );
             this.logger.log(`Sent email to owner/user ${eventData.user.email}`);
        }
        break;
      
      case 'ARCHIVE_TASK':
        this.logger.log('Action ARCHIVE_TASK: Not fully implemented yet (needs Prisma update)');
        break;

      default:
        this.logger.warn(`Unknown action: ${action}`);
    }
  }
}
