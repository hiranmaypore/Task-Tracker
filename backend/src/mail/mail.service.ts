import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {
  constructor(@InjectQueue('mail') private mailQueue: Queue) {}

  async sendTaskAssignedEmail(userId: string, email: string, taskTitle: string, projectName: string) {
    await this.mailQueue.add('send-email', {
      to: email,
      subject: `New Task Assigned: ${taskTitle}`,
      template: 'task-assigned',
      context: {
        taskTitle,
        projectName,
      },
    });
  }

  async sendReminderEmail(userId: string, email: string, taskTitle: string, projectName: string) {
    await this.mailQueue.add('send-email', {
      to: email,
      subject: `Reminder: ${taskTitle} is due soon!`,
      template: 'reminder',
      context: {
        taskTitle,
        projectName,
      },
    });
  }

  async sendGenericEmail(email: string, subject: string, body: string) {
    await this.mailQueue.add('send-email', {
      to: email,
      subject,
      template: 'generic', // Assuming a generic template exists or logic handles raw body
      context: {
        body,
      },
    });
  }

  async sendProjectInvitation(email: string, projectName: string, role: string, inviterName: string) {
    await this.mailQueue.add('send-email', {
      to: email,
      subject: `You've been invited to join ${projectName}`,
      template: 'project-invitation',
      context: {
        projectName,
        role,
        inviterName,
      },
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    await this.mailQueue.add('send-email', {
      to: email,
      subject: 'Welcome to FlytBase To-Do!',
      template: 'welcome',
      context: {
        name,
      },
    });
  }
}
