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

    let htmlContent = '';
    let textContent = '';

    if (template === 'task-assigned' || template === 'reminder') {
        htmlContent = `
            <div style="font-family: sans-serif;">
                <h2>${subject}</h2>
                <p><strong>Project:</strong> ${context.projectName}</p>
                <p><strong>Task:</strong> ${context.taskTitle}</p>
                <hr/>
                <small>To-Do List App Notification</small>
            </div>
        `;
        textContent = `To-Do List Notification\n${subject}\nProject: ${context.projectName}\nTask: ${context.taskTitle}`;
    } else if (template === 'project-invitation') {
        htmlContent = `
            <div style="font-family: sans-serif;">
                <h2>Project Invitation</h2>
                <p>You have been invited to join <strong>${context.projectName}</strong> as <strong>${context.role}</strong>.</p>
                <p>Invited by: ${context.inviterName}</p>
                <a href="http://localhost:5173/projects" style="display:inline-block;padding:10px 20px;background:black;color:white;text-decoration:none;">View Projects</a>
            </div>
        `;
        textContent = `Project Invitation\nYou have been invited to join ${context.projectName} as ${context.role} by ${context.inviterName}.`;
    } else if (template === 'welcome') {
        htmlContent = `
            <div style="font-family: sans-serif;">
                <h2>Welcome to FlytBase To-Do!</h2>
                <p>Hi ${context.name},</p>
                <p>Thanks for registering.</p>
            </div>
        `;
        textContent = `Welcome to FlytBase To-Do!\nHi ${context.name},\nThanks for registering.`;
    } else {
        // Generic
        htmlContent = `<div><h2>${subject}</h2><p>${context.body || JSON.stringify(context)}</p></div>`;
        textContent = `${subject}\n${context.body || JSON.stringify(context)}`;
    }

    try {
        const info = await this.transporter.sendMail({
          from: '"To-Do App" <noreply@todoapp.com>',
          to,
          subject,
          text: textContent,
          html: htmlContent,
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
