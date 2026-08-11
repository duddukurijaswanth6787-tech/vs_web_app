import { Test, TestingModule } from '@nestjs/testing';
import { CmsService } from './cms.service';
import { CmsRepository } from './cms.repository';
import { AuditService } from '@domains/audit/audit.service';
import { LoggerService } from '@common/logger/logger.service';

describe('CmsService', () => {
  let service: CmsService;
  let repository: CmsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CmsService,
        {
          provide: CmsRepository,
          useValue: {
            findBanners: jest
              .fn()
              .mockResolvedValue({ data: [], meta: { total: 0 } }),
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

    service = module.get<CmsService>(CmsService);
    repository = module.get<CmsRepository>(CmsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find banners', async () => {
    const result = await service.findBanners({});
    expect(result.data).toEqual([]);
    expect(repository.findBanners).toHaveBeenCalled();
  });
});
