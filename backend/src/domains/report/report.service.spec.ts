import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service';
import { PrismaService } from '@database/prisma.service';
import { StorageService } from '@infrastructure/storage/storage.service';

describe('ReportService', () => {
  let service: ReportService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findMany: jest.fn().mockResolvedValue([]),
              aggregate: jest
                .fn()
                .mockResolvedValue({ _sum: { grandTotal: 0 } }),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate sales report', async () => {
    const result = await service.generateSalesReport();
    expect(result).toBeDefined();
    expect(prisma.order.findMany).toHaveBeenCalled();
    expect(prisma.order.aggregate).toHaveBeenCalled();
  });
});
