import { Test, TestingModule } from '@nestjs/testing';
import { BrandsService } from './brands.service';
import { BrandsRepository } from './brands.repository';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';
import { CreateBrandDto } from './brands.types';

describe('BrandsService', () => {
  let service: BrandsService;
  let repository: BrandsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        {
          provide: BrandsRepository,
          useValue: {
            findBySlug: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findById: jest.fn(),
            softDelete: jest.fn(),
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
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    repository = module.get<BrandsRepository>(BrandsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a new brand', async () => {
    const dto: CreateBrandDto = {
      name: 'Test Brand',
      slug: 'test-brand',
      description: 'Test description',
      logo: 'test-logo',
      bannerImage: 'test-banner',
      website: 'https://test.com',
      isFeatured: true,
      isVisible: true,
      displayOrder: 0,
      status: 'ACTIVE',
    };
    const userId = 'user-1';
    const createdBrand = { id: 'brand-1', ...dto };

    const findBySlugSpy = jest
      .spyOn(repository, 'findBySlug')
      .mockResolvedValue(null);
    const createSpy = jest
      .spyOn(repository, 'create')
      .mockResolvedValue(createdBrand as any);
    const findByIdSpy = jest
      .spyOn(repository, 'findById')
      .mockResolvedValue(createdBrand as any);

    const result = await service.create(dto, userId);

    expect(createSpy).toHaveBeenCalled();
    expect(result).toBeDefined();

    findBySlugSpy.mockRestore();
    createSpy.mockRestore();
    findByIdSpy.mockRestore();
  });
});
