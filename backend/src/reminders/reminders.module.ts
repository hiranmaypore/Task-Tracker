import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RemindersService } from './reminders.service';
import { RemindersProcessor } from './reminders.processor';
import { EventsModule } from '../events/events.module';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reminders',
    }),
    EventsModule, // To send notifications
  ],
  providers: [RemindersService, RemindersProcessor],
  exports: [RemindersService],
})
export class RemindersModule {}
