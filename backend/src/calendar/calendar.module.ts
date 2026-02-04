import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
