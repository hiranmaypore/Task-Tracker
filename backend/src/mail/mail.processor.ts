import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Processor('mail')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    super();
    this.initTransporter();
  }

  private async initTransporter() {
    const host = this.configService.get('EMAIL_HOST');
    if (host) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('EMAIL_HOST'),
            port: Number(this.configService.get('EMAIL_PORT')),
            auth: {
                user: this.configService.get('EMAIL_USER'),
                pass: this.configService.get('EMAIL_PASS'),
            },
        });
    } else {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            this.logger.warn(`Using Ethereal Mail. Preview URLs will be logged.`);
        } catch (e) {
            this.logger.error('Failed to create Ethereal account', e);
        }
    }
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (!this.transporter) {
       await this.initTransporter();
    }

    if (!this.transporter) {
       this.logger.error('Transporter not initialized. Cannot send email.');
       return; 
    }

    const { to, subject, template, context } = job.data;
    this.logger.log(`Sending email to ${to} [${template}]`);

    const text = `
      To-Do List Notification
      -----------------------
      ${subject}
      
      Project: ${context.projectName}
      Task: ${context.taskTitle}
      
      (This is an automated message)
    `;

    try {
        const info = await this.transporter.sendMail({
          from: '"To-Do App" <noreply@todoapp.com>',
          to,
          subject,
          text,
          html: `<div style="font-family: sans-serif;">
                   <h2>${subject}</h2>
                   <p><strong>Project:</strong> ${context.projectName}</p>
                   <p><strong>Task:</strong> ${context.taskTitle}</p>
                   <hr/>
                   <small>To-Do List App Notification</small>
                 </div>`,
        });

        this.logger.log(`Message sent: ${info.messageId}`);
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            this.logger.log(`Preview URL: ${previewUrl}`);
        }
    } catch (e) {
        this.logger.error(`Failed to send email to ${to}: ${e.message}`);
        throw e; // Retry job
    }
  }
}
