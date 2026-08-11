import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from './inventory.repository';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: InventoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
            createMovement: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: NotificationService,
          useValue: { create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    repository = module.get<InventoryRepository>(InventoryRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find inventory by id', async () => {
    const inv = { id: 'inv-1', availableQuantity: 10 };
    jest.spyOn(repository, 'findById').mockResolvedValue(inv as any);

    const result = await service.findById('inv-1');
    expect(result.id).toBe('inv-1');
  });
});
