import { Controller, Get, Post, Delete, Query, UseGuards, Redirect } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /**
   * Step 1: Get OAuth authorization URL
   * Frontend redirects user to this URL
   */
  @Get('auth-url')
  getAuthUrl() {
    const url = this.calendarService.getAuthUrl();
    return { authUrl: url };
  }

  /**
   * Step 2: OAuth callback endpoint
   * Google redirects here after user authorizes
   */
  @Get('callback')
  @Redirect('http://localhost:8080/settings?google_sync=success', 302)
  async handleCallback(@Query('code') code: string, @User() user: any) {
    await this.calendarService.handleCallback(code, user.userId);
    return { url: 'http://localhost:8080/settings?google_sync=success' };
  }

  /**
   * Get calendar sync status
   */
  @Get('status')
  async getStatus(@User() user: any) {
    return this.calendarService.getSyncStatus(user.userId);
  }

  /**
   * Sync all pending tasks to Google Calendar
   */
  @Post('sync')
  async syncTasks(@User() user: any) {
    return this.calendarService.syncAllTasks(user.userId);
  }

  /**
   * Disconnect Google Calendar
   */
  @Delete('disconnect')
  async disconnect(@User() user: any) {
    return this.calendarService.disconnect(user.userId);
  }
}
