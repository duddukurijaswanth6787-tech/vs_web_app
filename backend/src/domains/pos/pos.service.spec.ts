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
import { DEFAULT_TERMINAL_ID, PosPaymentMethodType } from './pos.types';
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
      searchVariantsByName: jest.fn().mockResolvedValue([]),
      createCheckoutSession: jest.fn(),
      findCheckoutSessionByToken: jest.fn(),
      findCheckoutSessionById: jest.fn(),
      updateCheckoutSessionStatus: jest.fn(),
      findOrCreateWalkInCustomer: jest.fn(),
      // Real rates come from the product; an empty map means 0% here, which
      // keeps these tests about ordering and stock rather than tax.
      findProductTaxRates: jest.fn().mockResolvedValue(new Map()),
      createPosOrder: jest.fn(),
      findOrderByOrderNumber: jest.fn(),
      findInventoryQuantities: jest.fn(),
      // Billing requires an open shift. The existing cases here are all
      // "a normal sale on a normal terminal", so the default is a shift
      // that is open; the cases that care override it.
      findOpenShift: jest.fn(),
      createShift: jest.fn(),
      findOpenShiftForTerminal: jest
        .fn()
        .mockResolvedValue({ id: 'shift-1', terminalId: 'COUNTER_1' }),
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

  describe('searchProducts', () => {
    it('returns the same shape as a scan, including GST rate and stock', async () => {
      repository.searchVariantsByName.mockResolvedValue([
        {
          id: 'var-123',
          productId: 'prod-456',
          sku: 'KUR-BLU-L-005',
          barcode: '890100000005',
          title: 'Blue / L',
          salePriceOverride: 1299,
          costPrice: 700,
          inventory: { availableQuantity: 5, reservedQuantity: 2 },
          product: {
            name: 'Kurti',
            basePrice: 1499,
            taxPercentage: 12,
            hsnCode: '6204',
          },
        },
      ]);

      const [item] = await service.searchProducts('kur', false);
      expect(item.variantId).toBe('var-123');
      expect(item.price).toBe(1299);
      // Reserved stock is not sellable.
      expect(item.availableStock).toBe(3);
      // The whole point: a searched item must carry its own GST rate, or the
      // till falls back to the flat 5% that was just removed.
      expect(item.taxPercent).toBe(12);
      expect(item.mrp).toBe(1499);
      expect(item.hsnCode).toBe('6204');
      expect(item.costPrice).toBeUndefined();
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

  /**
   * A sale is matched to a shift by terminalId + time window -- there is no
   * shift foreign key on Order. So a sale billed with no shift open lands
   * outside every X/Z report and its cash is never expected at close: the
   * drawer reads over and nothing explains why.
   *
   * The rule used to live only in the web POS screen, leaving the mobile app
   * and any direct API caller free to bill without one. These pin it to the
   * service, where every client goes through it.
   */
  /**
   * Each device is its own register. A shift's takings are every POS sale on
   * its terminal within its window, so two overlapping shifts on one terminal
   * would each be charged with the other's sales and both drawers read over.
   */
  describe('openShift', () => {
    it('refuses a second shift on a terminal another cashier has open', async () => {
      repository.findOpenShiftForTerminal.mockResolvedValue({
        id: 'shift-1',
        cashierId: 'someone-else',
        terminalId: 'COUNTER_1',
        openedAt: new Date(),
        cashier: { firstName: 'Priya', lastName: 'R' },
      });

      await expect(
        service.openShift('cashier-1', {
          terminalId: 'COUNTER_1',
          openingCash: 500,
        }),
      ).rejects.toThrow(/Priya R already has an open shift/i);
      expect(repository.createShift).not.toHaveBeenCalled();
    });

    it('opens when the register is free', async () => {
      repository.findOpenShiftForTerminal.mockResolvedValue(null);
      repository.createShift.mockResolvedValue({
        id: 'shift-2',
        terminalId: 'MOBILE_1',
      });

      await expect(
        service.openShift('cashier-1', {
          terminalId: 'MOBILE_1',
          openingCash: 0,
        }),
      ).resolves.toBeDefined();
      expect(repository.createShift).toHaveBeenCalled();
    });
  });

  describe('completeSale shift enforcement', () => {
    const sale = {
      items: [
        {
          productId: 'prod-1',
          productName: 'Kurti',
          quantity: 1,
          unitPrice: 699,
        },
      ],
      paymentMethod: PosPaymentMethodType.CASH,
      amountPaid: 699,
    };

    it('refuses to bill when the terminal has no shift open', async () => {
      repository.findOpenShiftForTerminal.mockResolvedValue(null);

      await expect(service.completeSale('cashier-1', sale)).rejects.toThrow(
        /open a shift/i,
      );
      expect(repository.createPosOrder).not.toHaveBeenCalled();
    });

    it('checks the terminal the sale is actually billed against', async () => {
      // A client that sends no terminalId inherits the default, so its
      // takings land in that drawer -- the guard has to look there too.
      repository.findOpenShiftForTerminal.mockResolvedValue(null);

      await expect(service.completeSale('cashier-1', sale)).rejects.toThrow();
      expect(repository.findOpenShiftForTerminal).toHaveBeenCalledWith(
        DEFAULT_TERMINAL_ID,
      );

      repository.findOpenShiftForTerminal.mockClear();
      repository.findOpenShiftForTerminal.mockResolvedValue(null);
      await expect(
        service.completeSale('cashier-1', { ...sale, terminalId: 'MOBILE_1' }),
      ).rejects.toThrow();
      expect(repository.findOpenShiftForTerminal).toHaveBeenCalledWith(
        'MOBILE_1',
      );
    });

    it('bills against a shift a different cashier opened on that terminal', async () => {
      // The cash goes into this register's drawer whoever rang it up, and
      // that drawer is reconciled against the terminal's shift.
      repository.findOpenShiftForTerminal.mockResolvedValue({
        id: 'shift-1',
        cashierId: 'someone-else',
        terminalId: DEFAULT_TERMINAL_ID,
      });
      repository.findOrCreateWalkInCustomer.mockResolvedValue({ id: 'c-1' });
      repository.createPosOrder.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-1',
        channel: 'POS_SHOPORA',
        paymentMethod: 'CASH',
        status: 'CONFIRMED',
        grandTotal: 699,
        items: [{ id: 'item-1' }],
        createdAt: new Date(),
      });

      await expect(
        service.completeSale('cashier-1', sale),
      ).resolves.toMatchObject({ success: true });
    });

    it('still bills an offline sale with no shift open', async () => {
      // Shift state cannot be checked without the backend, and refusing to
      // bill during an outage defeats the point of the offline queue.
      repository.findOpenShiftForTerminal.mockResolvedValue(null);
      repository.findInventoryQuantities.mockResolvedValue(new Map());
      repository.findOrCreateWalkInCustomer.mockResolvedValue({ id: 'c-1' });
      repository.createPosOrder.mockResolvedValue({
        id: 'order-offline-1',
        orderNumber: 'ORD-OFFLINE-1',
        channel: 'POS_SHOPORA',
        paymentMethod: 'CASH',
        status: 'CONFIRMED',
        grandTotal: 699,
        items: [{ id: 'item-1' }],
        createdAt: new Date(),
      });

      const res = await service.completeSale('cashier-1', {
        ...sale,
        isOfflineSync: true,
      });

      expect(res.success).toBe(true);
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
      expect(workflow.deductInventory).toHaveBeenCalledWith(
        'order-pos-1',
        'cashier-1',
      );
      expect(gateway.emitSaleCompleted).toHaveBeenCalled();
      expect(gateway.emitTriggerPrint).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'POS_SALE_COMPLETED' }),
      );
    });

    it('records a split bill as one payment row per tender, change taken from cash', async () => {
      repository.findOrCreateWalkInCustomer.mockResolvedValue({
        id: 'cust-walkin',
      });
      repository.findProductTaxRates.mockResolvedValue(
        new Map([['prod-1', 0]]),
      );
      repository.createPosOrder.mockResolvedValue({
        id: 'order-pos-2',
        orderNumber: 'ORD-SPLIT-1',
        channel: 'POS_SHOPORA',
        paymentMethod: 'SPLIT',
        status: 'CONFIRMED',
        grandTotal: 1398,
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
        paymentMethod: PosPaymentMethodType.SPLIT,
        amountPaid: 1500,
        splitPayments: [
          { method: PosPaymentMethodType.CARD, amount: 1000 },
          { method: PosPaymentMethodType.CASH, amount: 500 },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.order.changeDue).toBe(102);
      expect(repository.createPosOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          payments: [
            { method: 'CARD', amount: 1000 },
            { method: 'CASH', amount: 398 },
          ],
        }),
      );
    });

    it('rejects a split that does not cover the bill the server calculated', async () => {
      repository.findOrCreateWalkInCustomer.mockResolvedValue({
        id: 'cust-walkin',
      });
      repository.findProductTaxRates.mockResolvedValue(
        new Map([['prod-1', 0]]),
      );

      await expect(
        service.completeSale('cashier-1', {
          items: [
            {
              productId: 'prod-1',
              productName: 'Kurti',
              quantity: 2,
              unitPrice: 699,
            },
          ],
          paymentMethod: PosPaymentMethodType.SPLIT,
          amountPaid: 1398,
          splitPayments: [{ method: PosPaymentMethodType.CASH, amount: 100 }],
        }),
      ).rejects.toThrow(/short by/);
      expect(repository.createPosOrder).not.toHaveBeenCalled();
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
      expect(res.order.orderNumber).toBe('OFF-COUNTER_1-abc123');
      expect(repository.createPosOrder).not.toHaveBeenCalled();
      expect(workflow.deductInventory).not.toHaveBeenCalled();
    });

    it('should throw a POS_STOCK_CONFLICT BusinessException when offline-sync stock is insufficient', async () => {
      repository.findOrderByOrderNumber.mockResolvedValue(null);
      repository.findOrCreateWalkInCustomer.mockResolvedValue({
        id: 'cust-walkin',
      });
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
      await expect(attempt).rejects.toMatchObject({
        errorCode: 'POS_STOCK_CONFLICT',
      });
      expect(repository.createPosOrder).not.toHaveBeenCalled();
    });

    it('should proceed when offline-sync stock is sufficient', async () => {
      repository.findOrderByOrderNumber.mockResolvedValue(null);
      repository.findOrCreateWalkInCustomer.mockResolvedValue({
        id: 'cust-walkin',
      });
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
