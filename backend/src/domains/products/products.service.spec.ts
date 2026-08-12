import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';
import { NotificationService } from '@domains/notification/notification.service';
import { PrismaService } from '@database/prisma.service';
import { CreateProductDto } from './products.types';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: ProductsRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            findAll: jest.fn(),
            create: jest.fn(),
            findBySlug: jest.fn(),
            findBySku: jest.fn(),
            findByBarcode: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), error: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: { create: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((callback) =>
              callback({
                product: {
                  create: jest.fn().mockResolvedValue({ id: 'prod-1' }),
                },
                productCategory: { createMany: jest.fn() },
                productAttribute: { createMany: jest.fn() },
              }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get<ProductsRepository>(ProductsRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list products', async () => {
    jest
      .spyOn(repository, 'findAll')
      .mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      });
    const result = await service.findAll({});
    expect(result.data).toEqual([]);
    expect(repository.findAll).toHaveBeenCalled();
  });

  it('should create a product', async () => {
    const dto: CreateProductDto = {
      name: 'Test Product',
      brandId: 'brand-1',
      basePrice: 100,
    };
    const userId = 'user-1';

    // Need to mock these methods in service for the create flow
    jest
      .spyOn(service as any, 'generateUniqueSlug')
      .mockResolvedValue('test-product');
    jest.spyOn(service as any, 'generateUniqueSku').mockResolvedValue('SKU123');
    jest
      .spyOn(service as any, 'generateUniqueBarcode')
      .mockResolvedValue('BAR123');
    jest
      .spyOn(repository, 'findById')
      .mockResolvedValue({ id: 'prod-1', name: 'Test Product' } as any);

    const result = await service.create(dto, userId);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(result.id).toBe('prod-1');
  });
});
