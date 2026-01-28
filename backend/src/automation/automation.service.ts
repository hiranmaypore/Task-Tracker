import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('automation') private automationQueue: Queue,
  ) {}

  /**
   * Main entry point: Event occurred -> Match Rules -> Queue Actions
   */
  async processEvent(event: any) {
    this.logger.log(`Processing event: ${event.type} for user ${event.userId}`);

    // 1. Fetch enabled rules for this user that match the trigger
    const rules = await this.prisma.automationRule.findMany({
      where: {
        ownerId: event.userId,
        // trigger: event.type, // Assuming 1:1 mapping or logic
        enabled: true,
      },
    });

    for (const rule of rules) {
       // Filter by trigger manually or add to where clause above if exact match
       if (rule.trigger !== event.type) continue;

       // 2. Evaluate Conditions
       if (this.evaluateConditions(rule.conditions, event)) {
         this.logger.log(`Rule matched: ${rule.id}. Actions: ${rule.actions.join(', ')}`);
         
         // 3. Push to Redis Queue
         await this.automationQueue.add('execute-action', {
           ruleId: rule.id,
           userId: event.userId,
           actions: rule.actions,
           eventData: event,
         });
       }
    }
  }

  private evaluateConditions(conditions: any, event: any): boolean {
    if (!Array.isArray(conditions)) return true; // No conditions = always run? or false? changing to true (catch-all)

    // Simple Rule Engine
    // Condition Schema: { field: "metadata.priority", op: "=", value: "HIGH" }
    return conditions.every(condition => {
      const eventValue = this.getNestedValue(event, condition.field);
      
      switch (condition.op) {
        case '=':
        case '==':
          return eventValue == condition.value;
        case '!=':
            return eventValue != condition.value;
        case '>':
          return eventValue > condition.value;
        case '<':
          return eventValue < condition.value;
        case 'contains':
            return (eventValue as string)?.includes(condition.value);
        default:
          return false;
      }
    });
  }

  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
  }
}
