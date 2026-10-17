import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';
import { OrderLifecycleService } from './order-lifecycle.service';
import { getOrderState } from './order-state';
import { RefundRepository } from '@domains/refund/refund.repository';
import { RefundService } from '@domains/refund/refund.service';
import { RefundStatus } from '@domains/refund/refund.types';
jest.setTimeout(60000);

// Opt in explicitly. Never run these fixtures against an application database.
const url = process.env.ORDER_FLOW_TEST_DATABASE_URL;
if (
  url &&
  url !== 'postgresql://order_flow_test@127.0.0.1:55439/order_flow_test'
)
  throw new Error('Only the isolated order_flow_test database is allowed');
const integration = url ? describe : describe.skip;

integration('Order lifecycle with PostgreSQL row locks', () => {
  let db: PrismaClient;
  let lifecycle: OrderLifecycleService;
  let customerId: string;
  let productId: string;
  let variantId: string;
  beforeAll(async () => {
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url!, max: 5 }),
      transactionOptions: { timeout: 30000, maxWait: 30000 },
    });
    lifecycle = new OrderLifecycleService(db);
    const suffix = randomUUID();
    const customer = await db.customerProfile.create({
      data: {
        preferredCategories: [],
        preferredBrands: [],
        preferredColors: [],
        preferredSizes: [],
        user: {
          create: {
            email: `${suffix}@example.invalid`,
            passwordHash: 'test-only',
            firstName: 'Test',
          },
        },
      },
    });
    customerId = customer.id;
    const product = await db.product.create({
      data: {
        sku: suffix,
        barcode: suffix,
        slug: suffix,
        name: 'Test saree',
        basePrice: 100,
        tags: [],
        collections: [],
        brand: { create: { name: 'Test brand', slug: suffix } },
        variants: {
          create: {
            sku: `${suffix}-v`,
            barcode: `${suffix}-v`,
            title: 'One size',
            inventory: { create: { availableQuantity: 10 } },
          },
        },
      },
      include: { variants: true },
    });
    productId = product.id;
    variantId = product.variants[0].id;
  }, 30000);
  beforeEach(async () => {
    await db.inventory.update({
      where: { variantId },
      data: { availableQuantity: 10, reservedQuantity: 0 },
    });
  });
  afterAll(async () => {
    await db?.$disconnect();
  });

  async function order(
    quantity = 1,
    method = 'RAZORPAY',
    amount = quantity * 100,
    channel: 'ONLINE_STORE' | 'POS_SHOPORA' = 'ONLINE_STORE',
  ) {
    return db.order.create({
      data: {
        orderNumber: randomUUID(),
        customerId,
        subtotal: quantity * 100,
        grandTotal: quantity * 100,
        channel,
        items: {
          create: {
            productId,
            variantId,
            productName: 'Test saree',
            sku: 'test',
            quantity,
            unitPrice: 100,
            totalPrice: quantity * 100,
          },
        },
        payments: {
          create: {
            paymentNumber: randomUUID(),
            method,
            provider: method === 'COD' ? 'MANUAL' : 'razorpay',
            amount,
            providerOrderId: randomUUID(),
          },
        },
      },
      include: { payments: true, items: true },
    });
  }
  const stock = () => db.inventory.findUniqueOrThrow({ where: { variantId } });
  const load = (id: string) =>
    db.order.findUniqueOrThrow({
      where: { id },
      include: { payments: true, refunds: true },
    });

  function refunds() {
    const gateway = { refundPayment: jest.fn().mockResolvedValue({ razorpayRefundId: randomUUID(), status: 'processed' }), confirmRefund: jest.fn().mockResolvedValue(undefined) };
    const service = new RefundService(new RefundRepository(db as any), { log: jest.fn().mockResolvedValue(undefined) } as any, gateway as any);
    return { service, gateway };
  }

  it('serializes refund allocation so concurrent requests cannot exceed captured funds', async () => {
    const a = await order();
    await db.payment.update({ where: { id: a.payments[0].id }, data: { status: 'CAPTURED' } });
    const { service } = refunds();
    const dto = { paymentId: a.payments[0].id, orderId: a.id, amount: 70, reason: 'Test refund' };
    const results = await Promise.allSettled([service.create('test', dto), service.create('test', dto)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await db.refund.count({ where: { orderId: a.id } })).toBe(1);
  });

  it('concurrent refund approval calls send money through the gateway only once', async () => {
    const a = await order();
    await db.payment.update({ where: { id: a.payments[0].id }, data: { status: 'CAPTURED' } });
    const { service, gateway } = refunds();
    const refund = await service.create('test', { paymentId: a.payments[0].id, orderId: a.id, amount: 100, reason: 'Test refund' });
    await Promise.all([service.updateStatus(refund.id, { status: RefundStatus.APPROVED }, 'admin'), service.updateStatus(refund.id, { status: RefundStatus.APPROVED }, 'admin')]);
    expect(gateway.refundPayment).toHaveBeenCalledTimes(1);
    expect(gateway.refundPayment).toHaveBeenCalledWith(a.payments[0].id, 100, refund.id);
    expect((await db.refund.findUniqueOrThrow({ where: { id: refund.id } })).status).toBe('COMPLETED');
  });

  it('manual cash refunds require a payout reference before completion', async () => {
    const a = await order(1, 'COD');
    await db.payment.update({ where: { id: a.payments[0].id }, data: { status: 'CAPTURED' } });
    const { service, gateway } = refunds();
    const refund = await service.create('test', { paymentId: a.payments[0].id, orderId: a.id, amount: 100, reason: 'Test cash refund' });
    await service.updateStatus(refund.id, { status: RefundStatus.APPROVED }, 'admin');
    await expect(service.updateStatus(refund.id, { status: RefundStatus.COMPLETED }, 'admin')).rejects.toMatchObject({ errorCode: 'REFUND_REFERENCE_REQUIRED' });
    expect(gateway.refundPayment).not.toHaveBeenCalled();
    expect((await service.updateStatus(refund.id, { status: RefundStatus.COMPLETED, transactionId: 'Cash-payout-test' }, 'admin')).status).toBe('COMPLETED');
  });

  it('releases only the cancelled order reservation and is idempotent', async () => {
    const a = await order(2),
      b = await order(3);
    await lifecycle.inventory('reserve', a.id, 'test');
    await lifecycle.inventory('reserve', b.id, 'test');
    await lifecycle.transition(a.id, 'CANCELLED', 'test');
    await lifecycle.transition(a.id, 'CANCELLED', 'test');
    expect(await stock()).toMatchObject({
      availableQuantity: 10,
      reservedQuantity: 3,
    });
  });
  it('rolls back a failed reservation without releasing another order stock', async () => {
    const a = await order(8),
      b = await order(3);
    await lifecycle.inventory('reserve', a.id, 'test');
    await expect(lifecycle.inventory('reserve', b.id, 'test')).rejects.toThrow(
      'Insufficient stock',
    );
    await lifecycle.transition(b.id, 'CANCELLED', 'test');
    expect(await stock()).toMatchObject({
      availableQuantity: 10,
      reservedQuantity: 8,
    });
  });
  it('serializes two capture callbacks and deducts stock once', async () => {
    const a = await order(2);
    await lifecycle.inventory('reserve', a.id, 'test');
    await Promise.all([
      lifecycle.capturePayment(a.payments[0].id, 'captured-1', 'test', {}),
      lifecycle.capturePayment(a.payments[0].id, 'captured-1', 'test', {}),
    ]);
    expect(await load(a.id)).toMatchObject({ status: 'CONFIRMED' });
    expect(await stock()).toMatchObject({
      availableQuantity: 8,
      reservedQuantity: 0,
    });
    expect(
      await db.paymentTransaction.count({
        where: { paymentId: a.payments[0].id, type: 'CAPTURED' },
      }),
    ).toBe(1);
  });
  it('restores confirmed sales exactly once on cancellation', async () => {
    const a = await order(2, 'COD');
    await lifecycle.inventory('reserve', a.id, 'test');
    await lifecycle.transition(a.id, 'CONFIRMED', 'test');
    await lifecycle.transition(a.id, 'CANCELLED', 'test');
    await lifecycle.inventory('restore', a.id, 'test');
    expect(await stock()).toMatchObject({
      availableQuantity: 10,
      reservedQuantity: 0,
    });
  });
  it('blocks unpaid fulfillment without changing stock or status', async () => {
    const a = await order();
    await expect(
      lifecycle.transition(a.id, 'CONFIRMED', 'test'),
    ).rejects.toThrow('Payment must be received');
    expect((await load(a.id)).status).toBe('PENDING');
    expect((await stock()).availableQuantity).toBe(10);
  });
  it('records a partial capture honestly without confirming the order', async () => {
    const a = await order(2, 'RAZORPAY', 100);
    await lifecycle.capturePayment(a.payments[0].id, 'partial', 'test', {});
    const current = await load(a.id);
    expect(current.status).toBe('PENDING');
    expect(getOrderState(current)).toMatchObject({
      paymentStatus: 'PARTIALLY_PAID',
      amountDue: 100,
      canFulfill: false,
    });
    expect((await stock()).availableQuantity).toBe(10);
  });
  it('rolls back capture and order confirmation if stock has vanished', async () => {
    const a = await order(2);
    await db.inventory.update({
      where: { variantId },
      data: { availableQuantity: 0 },
    });
    await expect(
      lifecycle.capturePayment(a.payments[0].id, 'shortage', 'test', {}),
    ).rejects.toThrow('Insufficient stock');
    const current = await load(a.id);
    expect(current.status).toBe('PENDING');
    expect(current.payments[0].status).toBe('PENDING');
  });
  it('does not let a POS sale consume another order reservation', async () => {
    const a = await order(9),
      b = await order(2, 'CASH', 200, 'POS_SHOPORA');
    await lifecycle.inventory('reserve', a.id, 'test');
    await expect(lifecycle.inventory('deduct', b.id, 'test')).rejects.toThrow(
      'Insufficient stock',
    );
    expect(await stock()).toMatchObject({
      availableQuantity: 10,
      reservedQuantity: 9,
    });
  });
  it('records late captured money on a cancelled order as refund due', async () => {
    const a = await order();
    await lifecycle.transition(a.id, 'CANCELLED', 'test');
    await lifecycle.capturePayment(a.payments[0].id, 'late', 'test', {});
    const current = await load(a.id);
    expect(current.status).toBe('CANCELLED');
    expect(getOrderState(current)).toMatchObject({
      refundDue: 100,
      paidAmount: 100,
    });
    expect((await stock()).availableQuantity).toBe(10);
  });
  it('does not expire a paid order or a cash on delivery order', async () => {
    const paid = await order(),
      cod = await order(1, 'COD');
    await lifecycle.capturePayment(paid.payments[0].id, 'paid', 'test', {});
    expect(await lifecycle.expire(paid.id, new Date(Date.now() + 1000))).toBe(
      false,
    );
    expect(await lifecycle.expire(cod.id, new Date(Date.now() + 1000))).toBe(
      false,
    );
  });
  it('requires a real waybill and records shipping atomically', async () => {
    const a = await order(1, 'COD');
    for (const status of [
      'CONFIRMED',
      'PROCESSING',
      'PACKING',
      'READY_TO_SHIP',
    ])
      await lifecycle.transition(a.id, status, 'test');
    await expect(lifecycle.transition(a.id, 'SHIPPED', 'test')).rejects.toThrow(
      'waybill',
    );
    await lifecycle.transition(a.id, 'SHIPPED', 'test', undefined, {
      courierPartner: 'Manual',
      waybillNumber: 'REAL-AWB-1',
    });
    expect(await load(a.id)).toMatchObject({
      status: 'SHIPPED',
      waybillNumber: 'REAL-AWB-1',
    });
  });
  it('restocks only the selected partial return and refuses excess quantities', async () => {
    const a = await order(3, 'COD');
    await lifecycle.transition(a.id, 'CONFIRMED', 'test');
    await db.$transaction((tx) =>
      lifecycle.restockTx(tx, {
        orderId: a.id,
        items: [{ variantId, quantity: 1 }],
        userId: 'test',
      }),
    );
    expect((await stock()).availableQuantity).toBe(8);
    await expect(
      db.$transaction((tx) =>
        lifecycle.restockTx(tx, {
          orderId: a.id,
          items: [{ variantId, quantity: 3 }],
        }),
      ),
    ).rejects.toThrow('exceeds stock sold');
    expect((await stock()).availableQuantity).toBe(8);
  });
});
