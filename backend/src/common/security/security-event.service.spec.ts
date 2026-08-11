import { Test, TestingModule } from '@nestjs/testing';
import {
  SecurityEventService,
  SecurityEventType,
} from './security-event.service';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '@common/logger/logger.service';

describe('SecurityEventService', () => {
  let service: SecurityEventService;
  let loggerService: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityEventService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(true) },
        },
        {
          provide: LoggerService,
          useValue: { warn: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<SecurityEventService>(SecurityEventService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log security event', () => {
    service.log({
      type: SecurityEventType.RATE_LIMIT_VIOLATION,
      ip: '127.0.0.1',
      path: '/api/test',
      method: 'POST',
      correlationId: 'test-id',
    });
    expect(loggerService.warn).toHaveBeenCalled();
  });
});
