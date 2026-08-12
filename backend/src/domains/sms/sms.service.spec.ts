import { Test, TestingModule } from '@nestjs/testing';
import { SmsService } from './sms.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';

describe('SmsService', () => {
  let service: SmsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(false) },
        },
        {
          provide: PrismaService,
          useValue: {
            smsLog: {
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

    service = module.get<SmsService>(SmsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should log SMS even if disabled', async () => {
    await service.send({
      phone: '1234567890',
      message: 'Hello',
      template: 'TEST',
    });
    expect(prisma.smsLog.create).toHaveBeenCalled();
    expect(prisma.smsLog.update).toHaveBeenCalled();
  });
});
