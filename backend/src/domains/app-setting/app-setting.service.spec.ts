import { Test, TestingModule } from '@nestjs/testing';
import { AppSettingService } from './app-setting.service';
import { AppSettingRepository } from './app-setting.repository';
import { AuditService } from '@domains/audit/audit.service';

describe('AppSettingService', () => {
  let service: AppSettingService;
  let repository: AppSettingRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppSettingService,
        {
          provide: AppSettingRepository,
          useValue: {
            findByKey: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AppSettingService>(AppSettingService);
    repository = module.get<AppSettingRepository>(AppSettingRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find setting by key', async () => {
    const setting = { id: 's-1', key: 'tax_rate', value: '18' };
    jest.spyOn(repository, 'findByKey').mockResolvedValue(setting as any);

    const result = await service.findByKey('tax_rate');
    expect(result.key).toBe('tax_rate');
    expect(repository.findByKey).toHaveBeenCalledWith('tax_rate');
  });
});
