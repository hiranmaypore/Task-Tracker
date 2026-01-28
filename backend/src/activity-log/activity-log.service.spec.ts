import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogService } from './activity-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';

describe('ActivityLogService', () => {
  let service: ActivityLogService;

  const mockPrismaService = {};
  const mockAutomationService = {
    processEvent: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AutomationService,
          useValue: mockAutomationService,
        },
      ],
    }).compile();

    service = module.get<ActivityLogService>(ActivityLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
