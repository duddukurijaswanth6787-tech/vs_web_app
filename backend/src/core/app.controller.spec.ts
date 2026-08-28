import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AwsBillingService } from '../domains/aws-billing/aws-billing.service';
import { AnalyticsService } from '../domains/analytics/analytics.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        // The controller picked up billing and analytics routes; the heartbeat
        // test only needs them to resolve, not to do anything.
        { provide: AwsBillingService, useValue: {} },
        { provide: AnalyticsService, useValue: {} },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return api status object', () => {
      expect(appController.getHello()).toHaveProperty('status', 'online');
    });
  });
});
