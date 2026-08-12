import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceService } from './invoice.service';
import { InvoiceRepository } from './invoice.repository';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';

describe('InvoiceService', () => {
  let service: InvoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: InvoiceRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<InvoiceService>(InvoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
