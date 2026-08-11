import { Test, TestingModule } from '@nestjs/testing';
import { DtdcService } from './dtdc.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';

describe('DtdcService', () => {
  let service: DtdcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DtdcService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            order: { findFirst: jest.fn() },
            dtdcShipment: { findFirst: jest.fn() },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DtdcService>(DtdcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
