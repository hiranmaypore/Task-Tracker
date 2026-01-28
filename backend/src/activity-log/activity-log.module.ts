import { Module, Global } from '@nestjs/common';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AutomationModule } from '../automation/automation.module';

@Global() // Make it global so other modules can use it
@Module({
  imports: [PrismaModule, AutomationModule],
  controllers: [ActivityLogController],
  providers: [ActivityLogService],
  exports: [ActivityLogService], // Export so other modules can inject it
})
export class ActivityLogModule {}
