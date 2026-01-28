import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private oauth2Client: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize OAuth2 client
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI', 'http://localhost:3000/calendar/callback');

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri,
    );
  }

  /**
   * Generate OAuth URL for user to authorize
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async handleCallback(code: string, userId: string) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Store tokens in database
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          calendarSyncEnabled: true,
        },
      });

      this.logger.log(`OAuth tokens stored for user ${userId}`);
      return { success: true, message: 'Calendar connected successfully' };
    } catch (error) {
      this.logger.error(`OAuth callback failed: ${error.message}`);
      throw new UnauthorizedException('Failed to authenticate with Google');
    }
  }

  /**
   * Get authenticated OAuth2 client for a user
   */
  private async getAuthenticatedClient(userId: string): Promise<OAuth2Client> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      throw new UnauthorizedException('Google Calendar not connected');
    }

    // Set credentials
    this.oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry?.getTime(),
    });

    // Check if token needs refresh
    if (user.googleTokenExpiry && new Date() >= user.googleTokenExpiry) {
      await this.refreshAccessToken(userId);
    }

    return this.oauth2Client;
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(userId: string) {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          googleAccessToken: credentials.access_token,
          googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        },
      });

      this.logger.log(`Access token refreshed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Failed to refresh Google token');
    }
  }

  /**
   * Sync task to Google Calendar
   */
  async syncTaskToCalendar(userId: string, taskId: string) {
    try {
      const client = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: client });

      // Get task details
      const task = await this.prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      // Create calendar event
      const event = {
        summary: task.title,
        description: `${task.description || ''}\n\nProject: ${task.project.name}\nPriority: ${task.priority}`,
        start: {
          dateTime: task.due_date?.toISOString() || new Date().toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: task.due_date 
            ? new Date(task.due_date.getTime() + 60 * 60 * 1000).toISOString() // +1 hour
            : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        colorId: this.getColorByPriority(task.priority),
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      this.logger.log(`Task ${taskId} synced to calendar: ${response.data.id}`);
      return { success: true, eventId: response.data.id || undefined };
    } catch (error) {
      this.logger.error(`Failed to sync task to calendar: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync all pending tasks to calendar
   */
  async syncAllTasks(userId: string) {
    try {
      const tasks = await this.prisma.task.findMany({
        where: {
          assignee_id: userId,
          status: { not: 'DONE' },
          due_date: { not: null },
        },
      });

      const results: Array<{ taskId: string; success: boolean; eventId?: string; error?: string }> = [];
      for (const task of tasks) {
        try {
          const result = await this.syncTaskToCalendar(userId, task.id);
          results.push({ taskId: task.id, ...result });
        } catch (error) {
          results.push({ taskId: task.id, success: false, error: error.message });
        }
      }

      return { synced: results.filter(r => r.success).length, total: tasks.length, results };
    } catch (error) {
      this.logger.error(`Bulk sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        calendarSyncEnabled: false,
      },
    });

    this.logger.log(`Calendar disconnected for user ${userId}`);
    return { success: true, message: 'Calendar disconnected' };
  }

  /**
   * Get calendar sync status
   */
  async getSyncStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        calendarSyncEnabled: true,
        googleTokenExpiry: true,
      },
    });

    return {
      connected: user?.calendarSyncEnabled || false,
      tokenExpiry: user?.googleTokenExpiry,
      needsRefresh: user?.googleTokenExpiry ? new Date() >= user.googleTokenExpiry : false,
    };
  }

  /**
   * Helper: Get calendar color by task priority
   */
  private getColorByPriority(priority: string): string {
    const colorMap = {
      HIGH: '11', // Red
      MEDIUM: '5', // Yellow
      LOW: '2', // Green
    };
    return colorMap[priority] || '1'; // Default blue
  }
}
