import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseService } from './warehouse.service';
import { WarehouseRepository } from './warehouse.repository';
import { AuditService } from '@domains/audit/audit.service';

describe('WarehouseService', () => {
  let service: WarehouseService;
  let repository: WarehouseRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WarehouseService,
        {
          provide: WarehouseRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<WarehouseService>(WarehouseService);
    repository = module.get<WarehouseRepository>(WarehouseRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find warehouse by id', async () => {
    const wh = { id: 'wh-1', name: 'Main Warehouse' };
    jest.spyOn(repository, 'findById').mockResolvedValue(wh as any);

    const result = await service.findById('wh-1');
    expect(result.id).toBe('wh-1');
  });
});
