import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Processor('automation')
export class AutomationConsumer extends WorkerHost {
  private readonly logger = new Logger(AutomationConsumer.name);

  constructor(private mailService: MailService) {
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
    switch (action) {
      case 'SEND_EMAIL':
        // Example action: Send email notification
        // We need user email. In a real app we might fetch user here or pass it in eventData
        if (eventData.user && eventData.user.email) {
            await this.mailService.sendGenericEmail(
                eventData.user.email,
                `Automation Alert: ${eventData.type}`,
                `Your automation rule triggered this email.\nEvent: ${JSON.stringify(eventData.metadata)}`
            );
        } else {
            this.logger.warn(`Cannot send email, no email found in event data for user ${userId}`);
        }
        break;
      
      case 'CREATE_TASK':
        // Logic to create a follow-up task
        this.logger.log('Action CREATE_TASK executed (Placeholder)');
        break;

      default:
        this.logger.warn(`Unknown action: ${action}`);
    }
  }
}
