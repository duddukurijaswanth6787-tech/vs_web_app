import { Test, TestingModule } from '@nestjs/testing';
import { PushNotificationService } from './push-notification.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushNotificationService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(false) },
        },
        {
          provide: PrismaService,
          useValue: {
            pushDevice: { findMany: jest.fn().mockResolvedValue([]) },
            pushNotificationLog: {
              create: jest.fn().mockResolvedValue({ id: 'log-1' }),
              update: jest.fn().mockResolvedValue({ id: 'log-1' }),
            },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PushNotificationService>(PushNotificationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log push even if disabled', async () => {
    await service.send({ title: 'Test', body: 'Test Body' });
    expect(prisma.pushNotificationLog.create).toHaveBeenCalled();
    expect(prisma.pushNotificationLog.update).toHaveBeenCalled();
  });
});
