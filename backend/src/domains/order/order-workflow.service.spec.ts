import { Test, TestingModule } from '@nestjs/testing';
import { OrderWorkflowService } from './order-workflow.service';
import { PrismaService } from '@database/prisma.service';
import { AuditService } from '@domains/audit/audit.service';
import { NotificationService } from '@domains/notification/notification.service';
import { EmailService } from '@domains/email/email.service';
import { OtpGatewayService } from '@domains/otp-gateway/otp-gateway.service';
import { TelegramService } from '@domains/telegram/telegram.service';
import { BusinessException } from '@common/exceptions';

describe('OrderWorkflowService - atomic inventory deduction/reservation', () => {
  let service: OrderWorkflowService;
  let prisma: {
    order: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    order: { findUnique: jest.Mock };
    $queryRaw: jest.Mock;
    inventory: { findUnique: jest.Mock; update: jest.Mock };
    inventoryMovement: { create: jest.Mock; findMany: jest.Mock };
  };

  const inventoryRow = {
    id: 'inv-1',
    availableQuantity: 5,
    reservedQuantity: 2,
    minimumStock: 1,
    reorderLevel: 2,
    allowBackorder: false,
  };

  const orderWithOneItem = {
    id: 'order-1',
    status: 'PENDING',
    orderNumber: 'ORD-20260821-000001',
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
      order: { findUnique: jest.fn() },
      $queryRaw: jest.fn(),
      inventory: { findUnique: jest.fn(), update: jest.fn() },
      inventoryMovement: { create: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    };

    prisma = {
      order: tx.order,
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderWorkflowService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
        { provide: NotificationService, useValue: { create: jest.fn() } },
        {
          provide: EmailService,
          useValue: { sendOrderConfirmationEmail: jest.fn() },
        },
        {
          provide: OtpGatewayService,
          useValue: { sendOrderConfirmedSms: jest.fn() },
        },
        {
          provide: TelegramService,
          useValue: {
            sendOrderNotification: jest.fn().mockResolvedValue(undefined),
            sendOrderStatusUpdate: jest.fn().mockResolvedValue(undefined),
            sendRefundNotification: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get(OrderWorkflowService);
  });

  describe('deductInventory', () => {
    it('deducts stock when enough is available, without throwing', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$queryRaw.mockResolvedValue([inventoryRow]);

      await expect(service.deductInventory('order-1')).resolves.toBeUndefined();
      expect(tx.inventory.findUnique).not.toHaveBeenCalled();
      expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(1);
      expect(tx.inventory.update).toHaveBeenCalledTimes(1);
    });

    it('throws with shortages instead of going negative when stock is insufficient', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$queryRaw.mockResolvedValue([]); // guard failed: not enough stock
      tx.inventory.findUnique.mockResolvedValue({
        variantId: 'variant-1',
        availableQuantity: 1,
        allowBackorder: false,
      });

      await expect(service.deductInventory('order-1')).rejects.toMatchObject({
        errorCode: 'ORDER_STOCK_CONFLICT',
      });
    });

    it('silently skips a variant with no inventory row at all (not stock-tracked)', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$queryRaw.mockResolvedValue([]);
      tx.inventory.findUnique.mockResolvedValue(null);

      await expect(service.deductInventory('order-1')).resolves.toBeUndefined();
    });

    it('rejects deduction when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.deductInventory('missing')).rejects.toMatchObject({ errorCode: 'ORDER_001' });
    });
  });

  describe('reserveInventory', () => {
    it('reserves stock when enough is available', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$queryRaw.mockResolvedValue([inventoryRow]);

      await expect(
        service.reserveInventory('order-1'),
      ).resolves.toBeUndefined();
      expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(1);
    });

    it('throws BusinessException ORDER_003 with shortages when stock is insufficient', async () => {
      prisma.order.findUnique.mockResolvedValue(orderWithOneItem);
      tx.$queryRaw.mockResolvedValue([]);
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
      tx.$queryRaw.mockResolvedValue([inventoryRow]);
      tx.inventoryMovement.findMany.mockResolvedValue([{ movementType: 'RESERVED', quantity: 3 }]);

      await expect(
        service.releaseInventory('order-1'),
      ).resolves.toBeUndefined();
      expect(prisma.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'order-1' } }),
      );
      expect(tx.inventoryMovement.create).toHaveBeenCalledTimes(1);
    });

    it('restoreInventory rejects an unknown order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.restoreInventory('missing'),
      ).rejects.toMatchObject({ errorCode: 'ORDER_001' });
    });
  });

  it('uses the customer user ID and keeps committed status despite notification failure', async () => {
    const failing = { create: jest.fn().mockRejectedValue(new Error('notification unavailable')) };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const telegram = { sendOrderStatusAlert: jest.fn().mockResolvedValue(undefined) };
    prisma.order.findUnique.mockResolvedValue({ id: 'order-1', orderNumber: 'ORD-1', grandTotal: 100,
      customer: { id: 'profile-id', userId: 'actual-user-id', user: { firstName: 'Test' } }, addresses: [] });
    const workflow = new OrderWorkflowService(prisma as any, audit as any, failing as any, {} as any, {} as any, telegram as any);
    await expect(workflow.afterTransition('order-1', 'CANCELLED', 'admin', 'PENDING')).resolves.toBeUndefined();
    expect(failing.create).toHaveBeenCalledWith(expect.objectContaining({ userId: 'actual-user-id' }));
  });
});
