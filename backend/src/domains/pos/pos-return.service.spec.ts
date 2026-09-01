import { Test, TestingModule } from '@nestjs/testing';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { PosGateway } from './pos.gateway';
import { BarcodeService } from './barcode.service';
import { PrinterService } from './printer.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { AuditService } from '@domains/audit/audit.service';
import { PosRefundMethodType } from './pos.types';

/**
 * Taking goods back over the counter moves real money out of a real drawer,
 * so the rules that matter are the ones that stop it paying out twice, paying
 * out more than was taken, or paying out where nothing is counting it.
 */
describe('PosService returns', () => {
  let service: PosService;
  let repository: Record<string, jest.Mock>;
  let workflow: Record<string, jest.Mock>;

  const orderItem = {
    id: 'item-1',
    variantId: 'var-1',
    productName: 'Kurti',
    variantTitle: 'Blue / L',
    sku: 'KUR-BLU-L',
    quantity: 2,
    unitPrice: 1000,
    discountAmount: 200, // 10% off the line
    taxAmount: 90,
  };

  const sale = (overrides: Record<string, unknown> = {}) => ({
    order: {
      id: 'order-1',
      orderNumber: 'ORD-POS-1',
      channel: 'POS_SHOPORA',
      paymentMethod: 'CASH',
      grandTotal: 1890,
      createdAt: new Date(),
      items: [orderItem],
      payments: [{ id: 'pay-1' }],
      customer: { id: 'cust-1', phone: '9876543210' },
      ...overrides,
    },
    returnedByItem: new Map<string, number>(),
  });

  beforeEach(async () => {
    repository = {
      findSaleForReturn: jest.fn().mockResolvedValue(sale()),
      findOpenShiftForTerminal: jest
        .fn()
        .mockResolvedValue({ id: 'shift-1', terminalId: 'COUNTER_1' }),
      createPosReturn: jest.fn(async (params: any) => {
        // Exercise the restock callback the way the real transaction does.
        await params.restock({});
        return {
          returnRequest: { id: 'ret-1', returnNumber: params.returnNumber },
          refund: {
            refundNumber: params.refundNumber,
            amount: params.refundAmount,
          },
        };
      }),
    };
    workflow = { restockReturnedItems: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        { provide: PosRepository, useValue: repository },
        { provide: PosGateway, useValue: {} },
        { provide: BarcodeService, useValue: {} },
        { provide: PrinterService, useValue: {} },
        { provide: OrderWorkflowService, useValue: workflow },
        { provide: AuditService, useValue: { log: jest.fn() } },
        {
          provide: (await import('@domains/coupon/coupon.service')).CouponService,
          useValue: { checkCoupon: jest.fn(), applyCoupon: jest.fn() },
        },
        {
          provide: (await import('@domains/gift-card/gift-card.service')).GiftCardService,
          useValue: { getBalance: jest.fn(), redeem: jest.fn() },
        },
        {
          provide: (await import('@domains/loyalty/loyalty.service')).LoyaltyService,
          useValue: { adminBalance: jest.fn(), adminRedeem: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(PosService);
  });

  const request = (overrides: Record<string, unknown> = {}) => ({
    orderNumber: 'ORD-POS-1',
    items: [{ orderItemId: 'item-1', quantity: 1 }],
    refundMethod: PosRefundMethodType.CASH,
    reason: 'Wrong size',
    ...overrides,
  });

  it('refunds what was actually paid for the line, not the list price', async () => {
    // 2 x 1000, less 200 discount, plus 90 tax = 1890 for two, so 945 for one.
    // Refunding the 1000 list price would hand back money never taken.
    const res = await service.createReturn('cashier-1', request());

    expect(res.refundAmount).toBe(945);
  });

  it('refuses to return more than is still returnable', async () => {
    repository.findSaleForReturn.mockResolvedValue({
      ...sale(),
      returnedByItem: new Map([['item-1', 2]]), // both already went back
    });

    await expect(
      service.createReturn('cashier-1', request() as never),
    ).rejects.toThrow(/Only 0 .* can still be returned/i);
    expect(repository.createPosReturn).not.toHaveBeenCalled();
  });

  it('refuses to pay out with no shift open on the register', async () => {
    // Cash leaving a drawer nobody is counting reads as a shortfall at close.
    repository.findOpenShiftForTerminal.mockResolvedValue(null);

    await expect(
      service.createReturn('cashier-1', request() as never),
    ).rejects.toThrow(/open a shift/i);
    expect(repository.createPosReturn).not.toHaveBeenCalled();
  });

  it('refuses an item that was never on that sale', async () => {
    await expect(
      service.createReturn(
        'cashier-1',
        request({ items: [{ orderItemId: 'not-mine', quantity: 1 }] }) as never,
      ),
    ).rejects.toThrow(/not part of/i);
  });

  it('will not refund an online order at the till', async () => {
    // A refund is tied to a drawer through its order's terminal; an online
    // order has none, so the payout would never be expected at close.
    repository.findSaleForReturn.mockResolvedValue(sale({ channel: 'WEB' }));

    await expect(
      service.createReturn('cashier-1', request() as never),
    ).rejects.toThrow(/not sold in store/i);
  });

  it('restocks exactly what came back', async () => {
    await service.createReturn('cashier-1', request());

    expect(workflow.restockReturnedItems).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        orderId: 'order-1',
        items: [{ orderItemId: 'item-1', variantId: 'var-1', quantity: 1 }],
      }),
    );
  });

  it('records the method the money actually went out by', async () => {
    // getCashMovementForWindow only subtracts refunds marked CASH, so a card
    // refund recorded as cash would make the drawer read short.
    await service.createReturn(
      'cashier-1',
      request({ refundMethod: PosRefundMethodType.ORIGINAL }),
    );

    expect(repository.createPosReturn).toHaveBeenCalledWith(
      expect.objectContaining({ refundMethod: 'CASH' }),
    );
  });

  it('asks the cashier to choose when the sale records no payment method', async () => {
    repository.findSaleForReturn.mockResolvedValue(
      sale({ paymentMethod: null }),
    );

    await expect(
      service.createReturn(
        'cashier-1',
        request({ refundMethod: PosRefundMethodType.ORIGINAL }) as never,
      ),
    ).rejects.toThrow(/Choose how to refund/i);
  });

  it('reports what is still returnable, net of earlier returns', async () => {
    repository.findSaleForReturn.mockResolvedValue({
      ...sale(),
      returnedByItem: new Map([['item-1', 1]]),
    });

    const res = await service.lookupSaleForReturn('ORD-POS-1');

    expect(res.items[0]).toMatchObject({
      quantity: 2,
      alreadyReturned: 1,
      returnableQuantity: 1,
      unitRefund: 945,
    });
  });
});
