import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { PosGateway } from './pos.gateway';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { AuditService } from '@domains/audit/audit.service';
import { BarcodeService } from './barcode.service';
import { PrinterService } from './printer.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessException } from '@common/exceptions';
import { PosPaymentMethodType } from './pos.types';
import { CheckoutSessionStatus } from '@prisma/client';

describe('PosService (Phase 1 Backend)', () => {
  let service: PosService;
  let repository: Record<string, jest.Mock>;
  let gateway: Record<string, jest.Mock>;
  let workflow: Record<string, jest.Mock>;
  let auditService: Record<string, jest.Mock>;

  beforeEach(async () => {
    repository = {
      findVariantByBarcode: jest.fn(),
      createCheckoutSession: jest.fn(),
      findCheckoutSessionByToken: jest.fn(),
      findCheckoutSessionById: jest.fn(),
      updateCheckoutSessionStatus: jest.fn(),
      findOrCreateWalkInCustomer: jest.fn(),
      createPosOrder: jest.fn(),
      findOrderByOrderNumber: jest.fn(),
      findInventoryQuantities: jest.fn(),
    };

    gateway = {
      emitSessionAdopted: jest.fn(),
      emitSaleCompleted: jest.fn(),
      emitTriggerPrint: jest.fn(),
    };

    workflow = {
      generateOrderNumber: jest.fn().mockResolvedValue('ORD-20260811-POS101'),
      deductInventory: jest.fn().mockResolvedValue(true),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: repository },
        { provide: PosGateway, useValue: gateway },
        {
          provide: BarcodeService,
          useValue: {
            generateBarcodeBuffer: jest.fn(),
            generateBatchStickersHtml: jest.fn(),
          },
        },
        {
          provide: PrinterService,
          useValue: {
            generateHtmlInvoiceReceipt: jest.fn(),
            buildEscPosInvoiceReceipt: jest.fn(),
            buildTsplStickerLabel: jest.fn(),
          },
        },
        { provide: OrderWorkflowService, useValue: workflow },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
  });

  describe('scanBarcode', () => {
    it('should throw NotFoundException if variant does not exist', async () => {
      repository.findVariantByBarcode.mockResolvedValue(null);
      await expect(
        service.scanBarcode({ barcode: 'INVALID_BARCODE' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return variant scan result if barcode exists', async () => {
      repository.findVariantByBarcode.mockResolvedValue({
        id: 'var-123',
        productId: 'prod-456',
        sku: 'KUR-BLU-L-005',
        barcode: '890100000005',
        title: 'Blue / L / Cotton',
        salePriceOverride: 699,
        costPrice: 420,
        inventory: { availableQuantity: 18 },
        product: { name: "Women's Designer Kurti", basePrice: 699 },
        media: [{ url: 'http://localhost/image.png' }],
      });

      const result = await service.scanBarcode(
        { barcode: '890100000005' },
        true,
      );
      expect(result.productId).toBe('prod-456');
      expect(result.variantId).toBe('var-123');
      expect(result.availableStock).toBe(18);
      expect(result.price).toBe(699);
      expect(result.costPrice).toBe(420);
    });

    it('should hide costPrice if isOwnerOrManager is false', async () => {
      repository.findVariantByBarcode.mockResolvedValue({
        id: 'var-123',
        productId: 'prod-456',
        sku: 'KUR-BLU-L-005',
        barcode: '890100000005',
        title: 'Blue / L',
        salePriceOverride: 699,
        costPrice: 420,
        inventory: { availableQuantity: 18 },
        product: { name: 'Kurti' },
      });

      const result = await service.scanBarcode(
        { barcode: '890100000005' },
        false,
      );
      expect(result.costPrice).toBeUndefined();
    });
  });

  describe('createCheckoutSession', () => {
    it('should throw BadRequestException if cart items are empty', async () => {
      await expect(
        service.createCheckoutSession('user-1', { items: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate sessionId, handoffToken, and return session payload', async () => {
      const mockItems = [
        {
          productId: 'prod-1',
          productName: 'Kurti',
          quantity: 2,
          unitPrice: 699,
        },
      ];
      repository.createCheckoutSession.mockResolvedValue({
        id: 'sess-id-1',
        sessionId: 'SHOP-2026-123456',
        handoffToken: '123-456',
        subtotal: 1398,
        discountTotal: 0,
        taxTotal: 69.9,
        grandTotal: 1467.9,
        status: CheckoutSessionStatus.WAITING_FOR_WEB,
        expiresAt: new Date(),
        createdAt: new Date(),
      });

      const session = await service.createCheckoutSession('cashier-1', {
        items: mockItems,
      });

      expect(session.sessionId).toContain('SHOP-2026-');
      expect(session.handoffToken).toHaveLength(7); // "123-456"
      expect(session.grandTotal).toBe(1467.9);
    });
  });

  describe('adoptHandoffSession', () => {
    it('should throw NotFoundException if token is invalid', async () => {
      repository.findCheckoutSessionByToken.mockResolvedValue(null);
      await expect(
        service.adoptHandoffSession({ handoffToken: '999-999' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should adopt session and emit WebSocket event', async () => {
      const future = new Date(Date.now() + 100000);
      repository.findCheckoutSessionByToken.mockResolvedValue({
        id: 'sess-1',
        sessionId: 'SHOP-2026-123456',
        handoffToken: '123-456',
        status: CheckoutSessionStatus.WAITING_FOR_WEB,
        expiresAt: future,
        cart: [],
        customer: null,
      });
      repository.updateCheckoutSessionStatus.mockResolvedValue({
        id: 'sess-1',
        sessionId: 'SHOP-2026-123456',
        handoffToken: '123-456',
        status: CheckoutSessionStatus.IN_PROGRESS_ON_WEB,
        subtotal: 1398,
        discountTotal: 0,
        taxTotal: 70,
        grandTotal: 1468,
        cart: [],
        customer: null,
        expiresAt: future,
        createdAt: new Date(),
      });

      const adopted = await service.adoptHandoffSession({
        handoffToken: '123-456',
      });
      expect(adopted.status).toBe(CheckoutSessionStatus.IN_PROGRESS_ON_WEB);
      expect(gateway.emitSessionAdopted).toHaveBeenCalled();
    });
  });

  describe('completeSale', () => {
    it('should create POS order, deduct inventory, and emit print events', async () => {
      repository.findOrCreateWalkInCustomer.mockResolvedValue({
        id: 'cust-walkin',
      });
      repository.createPosOrder.mockResolvedValue({
        id: 'order-pos-1',
        orderNumber: 'ORD-20260811-POS101',
        channel: 'POS_SHOPORA',
        paymentMethod: 'UPI',
        status: 'CONFIRMED',
        grandTotal: 1468,
        items: [{ id: 'item-1' }],
        createdAt: new Date(),
      });

      const res = await service.completeSale('cashier-1', {
        items: [
          {
            productId: 'prod-1',
            productName: 'Kurti',
            quantity: 2,
            unitPrice: 699,
          },
        ],
        paymentMethod: PosPaymentMethodType.UPI,
        amountPaid: 1500,
      });

      expect(res.success).toBe(true);
      expect(workflow.deductInventory).toHaveBeenCalledWith('order-pos-1');
      expect(gateway.emitSaleCompleted).toHaveBeenCalled();
      expect(gateway.emitTriggerPrint).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'POS_SALE_COMPLETED' }),
      );
    });

    it('should replay an existing order instead of creating a duplicate when clientOrderNumber already exists', async () => {
      repository.findOrderByOrderNumber.mockResolvedValue({
        id: 'order-pos-1',
        orderNumber: 'OFF-COUNTER_1-abc123',
        channel: 'POS_SHOPORA',
        paymentMethod: 'UPI',
        status: 'CONFIRMED',
        grandTotal: 1468,
        items: [{ id: 'item-1' }],
        createdAt: new Date(),
      });

      const res = await service.completeSale('cashier-1', {
        clientOrderNumber: 'OFF-COUNTER_1-abc123',
        isOfflineSync: true,
        items: [
          { productId: 'prod-1', productName: 'Kurti', quantity: 2, unitPrice: 699 },
        ],
        paymentMethod: PosPaymentMethodType.UPI,
        amountPaid: 1500,
      });

      expect(res.success).toBe(true);
      expect(res.order.orderNumber).toBe('OFF-COUNTER_1-abc123');
      expect(repository.createPosOrder).not.toHaveBeenCalled();
      expect(workflow.deductInventory).not.toHaveBeenCalled();
    });

    it('should throw a POS_STOCK_CONFLICT BusinessException when offline-sync stock is insufficient', async () => {
      repository.findOrderByOrderNumber.mockResolvedValue(null);
      repository.findOrCreateWalkInCustomer.mockResolvedValue({ id: 'cust-walkin' });
      repository.findInventoryQuantities.mockResolvedValue(
        new Map([['var-1', { availableQuantity: 1, allowBackorder: false }]]),
      );

      const attempt = service.completeSale('cashier-1', {
        clientOrderNumber: 'OFF-COUNTER_1-def456',
        isOfflineSync: true,
        items: [
          {
            productId: 'prod-1',
            variantId: 'var-1',
            productName: 'Kurti',
            quantity: 3,
            unitPrice: 699,
          },
        ],
        paymentMethod: PosPaymentMethodType.UPI,
        amountPaid: 2097,
      });

      await expect(attempt).rejects.toThrow(BusinessException);
      await expect(attempt).rejects.toMatchObject({ errorCode: 'POS_STOCK_CONFLICT' });
      expect(repository.createPosOrder).not.toHaveBeenCalled();
    });

    it('should proceed when offline-sync stock is sufficient', async () => {
      repository.findOrderByOrderNumber.mockResolvedValue(null);
      repository.findOrCreateWalkInCustomer.mockResolvedValue({ id: 'cust-walkin' });
      repository.findInventoryQuantities.mockResolvedValue(
        new Map([['var-1', { availableQuantity: 10, allowBackorder: false }]]),
      );
      repository.createPosOrder.mockResolvedValue({
        id: 'order-pos-2',
        orderNumber: 'OFF-COUNTER_1-ghi789',
        channel: 'POS_SHOPORA',
        paymentMethod: 'UPI',
        status: 'CONFIRMED',
        grandTotal: 1468,
        items: [{ id: 'item-1' }],
        createdAt: new Date(),
      });

      const res = await service.completeSale('cashier-1', {
        clientOrderNumber: 'OFF-COUNTER_1-ghi789',
        isOfflineSync: true,
        items: [
          {
            productId: 'prod-1',
            variantId: 'var-1',
            productName: 'Kurti',
            quantity: 2,
            unitPrice: 699,
          },
        ],
        paymentMethod: PosPaymentMethodType.UPI,
        amountPaid: 1468,
      });

      expect(res.success).toBe(true);
      expect(repository.createPosOrder).toHaveBeenCalledWith(
        expect.objectContaining({ orderNumber: 'OFF-COUNTER_1-ghi789' }),
      );
    });
  });
});
