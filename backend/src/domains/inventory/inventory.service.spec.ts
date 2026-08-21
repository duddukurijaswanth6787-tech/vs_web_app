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
            updateStock: jest.fn(),
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

  describe('adjustStock', () => {
    it('treats quantity as the target absolute count, not a delta', async () => {
      const inv = {
        id: 'inv-1',
        variantId: 'variant-1',
        availableQuantity: 20,
        reservedQuantity: 2,
        minimumStock: 5,
        maximumStock: 100,
        reorderLevel: 10,
        stockStatus: 'IN_STOCK',
        allowBackorder: false,
      };
      jest.spyOn(repository, 'findById').mockResolvedValue(inv as any);

      await service.adjustStock('inv-1', { quantity: 47, reason: 'Physical count' }, 'user-1');

      // 47 is the new total, not "add 47 to the existing 20".
      expect(repository.updateStock).toHaveBeenCalledWith('inv-1', { availableQuantity: 47 });
      expect(repository.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          movementType: 'ADJUSTMENT',
          quantity: 27, // signed delta: 47 - 20
          previousQuantity: 20,
          newQuantity: 47,
        }),
      );
    });

    it('logs a negative delta when the target is below the current quantity', async () => {
      const inv = {
        id: 'inv-1',
        variantId: 'variant-1',
        availableQuantity: 20,
        reservedQuantity: 0,
        minimumStock: 0,
        maximumStock: 100,
        reorderLevel: 0,
        stockStatus: 'IN_STOCK',
        allowBackorder: false,
      };
      jest.spyOn(repository, 'findById').mockResolvedValue(inv as any);

      await service.adjustStock('inv-1', { quantity: 5, reason: 'Damaged batch found' }, 'user-1');

      expect(repository.updateStock).toHaveBeenCalledWith('inv-1', { availableQuantity: 5 });
      expect(repository.createMovement).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: -15,
          previousQuantity: 20,
          newQuantity: 5,
        }),
      );
    });
  });
});
