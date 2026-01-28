import { Test, TestingModule } from '@nestjs/testing';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { ProjectMemberGuard } from '../auth/guards/project-member.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('StatisticsController', () => {
  let controller: StatisticsController;

  const mockStatisticsService = {
    getDashboardStats: jest.fn(),
    getProjectStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StatisticsController],
      providers: [
        {
          provide: StatisticsService,
          useValue: mockStatisticsService,
        },
      ],
    })
    .overrideGuard(ProjectMemberGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<StatisticsController>(StatisticsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
