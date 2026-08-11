import { Test, TestingModule } from '@nestjs/testing';
import { PackingService } from './packing.service';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';

describe('PackingService', () => {
  let service: PackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PackingService,
        {
          provide: PrismaService,
          useValue: {
            order: { findFirst: jest.fn() },
            packingJob: { findFirst: jest.fn(), create: jest.fn() },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PackingService>(PackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
