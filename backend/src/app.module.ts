import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoutesController } from './routes.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { CommentsModule } from './comments/comments.module';
import { ActivityLogModule } from './activity-log/activity-log.module';
import { StatisticsModule } from './statistics/statistics.module';
import { EventsModule } from './events/events.module';
import { RemindersModule } from './reminders/reminders.module';
import { BullModule } from '@nestjs/bullmq';
import { MailModule } from './mail/mail.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AutomationModule } from './automation/automation.module';
import { CalendarModule } from './calendar/calendar.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const store = await redisStore({
          url: redisUrl || `redis://${configService.get('REDIS_HOST', 'localhost')}:${configService.get('REDIS_PORT', 6379)}`,
          ttl: 60 * 1000,
        });
        return {
          store: store as any,
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        if (redisUrl) {
            const url = new URL(redisUrl);
            return {
              connection: {
                host: url.hostname,
                port: Number(url.port),
                username: url.username,
                password: url.password,
                tls: url.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
              },
            };
        }
        return {
          connection: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    TasksModule,
    ProjectsModule,
    ActivityLogModule,
    CommentsModule,
    StatisticsModule,
    EventsModule,
    RemindersModule,
    MailModule,
    AnalyticsModule,
    AutomationModule,
    NotificationsModule,
    CalendarModule,
  ],
  controllers: [AppController, RoutesController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
