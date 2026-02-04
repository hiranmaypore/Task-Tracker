import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { AutomationConsumer } from './automation.consumer';
import { AutomationController } from './automation.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from '../mail/mail.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    MailModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'automation',
    }),
  ],
  controllers: [AutomationController],
  providers: [AutomationService, AutomationConsumer],
  exports: [AutomationService],
})
export class AutomationModule {}
