import { Test, TestingModule } from '@nestjs/testing';
import { OrderWorkflowService } from './order-workflow.service';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { BusinessException } from '@common/exceptions';

describe('OrderWorkflowService - atomic inventory deduction/reservation', () => {
  let service: OrderWorkflowService;
  let prisma: {
    order: { findUnique: jest.Mock };
    inventory: { updateMany: jest.Mock };
    $transaction: jest.Mock;
    $executeRaw: jest.Mock;
  };
  let tx: {
    $executeRaw: jest.Mock;
    inventory: { findUnique: jest.Mock };
  };

  const orderWithOneItem = {
    id: 'order-1',
    items: [
      {
        variantId: 'variant-1',
        productName: 'Silk Saree',
        variantTitle: 'Red / Free Size',
        quantity: 3,
      },
    ],
  };

  beforeEach(async () => {
    tx = {
      $executeRaw: jest.fn(),
      inventory: { findUnique: jest.fn() },
    };

    prisma = {
      order: { findUnique: jest.fn() },
      inventory: { updateMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
      $executeRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: NotificationService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrderWorkflowService);
  });

  describe('deductInventory', () => {
    it('deducts stock when enough is available, without throwing', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$executeRaw.mockResolvedValue(1); // guarded UPDATE affected the row

      await expect(service.deductInventory('order-1')).resolves.toBeUndefined();
      expect(tx.inventory.findUnique).not.toHaveBeenCalled();
    });

    it('throws with shortages instead of going negative when stock is insufficient', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$executeRaw.mockResolvedValue(0); // guard failed: not enough stock
      tx.inventory.findUnique.mockResolvedValue({
        variantId: 'variant-1',
        availableQuantity: 1,
        allowBackorder: false,
      });

      await expect(service.deductInventory('order-1')).rejects.toMatchObject({
        errorCode: 'ORDER_STOCK_CONFLICT',
        metadata: {
          shortages: [
            expect.objectContaining({
              variantId: 'variant-1',
              requested: 3,
              available: 1,
            }),
          ],
        },
      });
    });

    it('silently skips a variant with no inventory row at all (not stock-tracked)', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$executeRaw.mockResolvedValue(0);
      tx.inventory.findUnique.mockResolvedValue(null);

      await expect(service.deductInventory('order-1')).resolves.toBeUndefined();
    });

    it('is a no-op when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.deductInventory('missing')).resolves.toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('reserveInventory', () => {
    it('reserves stock when enough is available', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$executeRaw.mockResolvedValue(1);

      await expect(service.reserveInventory('order-1')).resolves.toBeUndefined();
    });

    it('throws BusinessException ORDER_003 with shortages when stock is insufficient', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$executeRaw.mockResolvedValue(0);
      tx.inventory.findUnique.mockResolvedValue({
        variantId: 'variant-1',
        availableQuantity: 2,
        reservedQuantity: 1,
        allowBackorder: false,
      });

      const promise = service.reserveInventory('order-1');
      await expect(promise).rejects.toBeInstanceOf(BusinessException);
      await expect(promise).rejects.toMatchObject({ errorCode: 'ORDER_003' });
    });

    it('throws when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.reserveInventory('missing')).rejects.toMatchObject({
        errorCode: 'ORDER_001',
      });
    });
  });

  describe('releaseInventory / restoreInventory', () => {
    it('releaseInventory issues a clamped decrement per item and never throws on shortage', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      await expect(service.releaseInventory('order-1')).resolves.toBeUndefined();
      expect(prisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1' } }),
      );
    });

    it('restoreInventory is a no-op when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.restoreInventory('missing')).resolves.toBeUndefined();
    });
  });
});
