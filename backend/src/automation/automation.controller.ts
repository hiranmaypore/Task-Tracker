import { Controller, Post, Body, Get, UseGuards, Param, Delete } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../auth/user.decorator';

@Controller('automation')
@UseGuards(JwtAuthGuard)
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly prisma: PrismaService 
  ) {}

  @Post('rules')
  async createRule(@User() user: any, @Body() ruleData: any) {
    // In a real app we should use a DTO
    return this.prisma.automationRule.create({
      data: {
        ...ruleData,
        ownerId: user.userId,
      },
    });
  }

  @Get('rules')
  async getRules(@User() user: any) {
    return this.prisma.automationRule.findMany({
      where: { ownerId: user.userId },
    });
  }

  @Delete('rules/:id')
  async deleteRule(@User() user: any, @Param('id') id: string) {
      return this.prisma.automationRule.deleteMany({
          where: {
              id,
              ownerId: user.userId
          }
      });
  }
}
