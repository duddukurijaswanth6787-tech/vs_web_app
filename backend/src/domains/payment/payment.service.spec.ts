import { PaymentService } from './payment.service';
import { createHmac } from 'crypto';

describe('PaymentService order payment contract', () => {
  let service: PaymentService,
    payment: any,
    order: any,
    db: any,
    workflow: any,
    gateway: any,
    settings: any;
  beforeEach(() => {
    payment = {
      id: 'payment',
      orderId: 'order',
      paymentNumber: 'PAY-test',
      method: 'RAZORPAY',
      provider: 'razorpay',
      status: 'PENDING',
      amount: 1500,
      currency: 'INR',
      providerOrderId: 'order_gateway',
      createdBy: 'customer',
      createdAt: new Date(),
    };
    order = {
      id: 'order',
      status: 'PENDING',
      grandTotal: 1500,
      currency: 'INR',
      customer: { userId: 'customer' },
      payments: [],
      refunds: [],
    };
    db = {
      $queryRaw: jest.fn(),
      order: { findUnique: jest.fn(async () => order) },
      payment: {
        create: jest.fn(async (args) => ({ ...payment, ...args.data })),
        findFirst: jest.fn(async () => payment),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    db.$transaction = jest.fn((cb) => cb(db));
    const repo = {
      findById: jest.fn(async () => payment),
      generatePaymentNumber: jest.fn().mockResolvedValue('PAY-test'),
    };
    workflow = {
      capturePayment: jest.fn(async () => {
        payment.status = 'CAPTURED';
        return payment;
      }),
    };
    settings = {
      getByKey: jest.fn(async (key) =>
        key === 'razorpay.key_id'
          ? 'rzp_public'
          : key === 'razorpay.webhook_secret'
            ? 'webhook-secret'
            : 'key-secret',
      ),
    };
    service = new PaymentService(
      repo as any,
      { log: jest.fn().mockResolvedValue(undefined) } as any,
      workflow,
      { get: jest.fn((_key, fallback) => fallback) } as any,
      db,
      settings,
      {} as any,
    );
    gateway = {
      orders: {
        create: jest.fn().mockResolvedValue({ id: 'order_gateway' }),
        fetch: jest.fn().mockResolvedValue({ status: 'paid' }),
        fetchPayments: jest.fn().mockResolvedValue({ items: [] }),
      },
      payments: {
        fetch: jest
          .fn()
          .mockResolvedValue({
            id: 'pay_gateway',
            order_id: 'order_gateway',
            amount: 150000,
            currency: 'INR',
            status: 'captured',
          }),
      },
    };
    jest.spyOn(service as any, 'getRazorpayClient').mockResolvedValue(gateway);
  });
  const signature = () =>
    createHmac('sha256', 'key-secret')
      .update('order_gateway|pay_gateway')
      .digest('hex');
  function webhook(event: string, entity: any) {
    const body = JSON.stringify({ event, payload: { payment: { entity } } });
    return [
      body,
      createHmac('sha256', 'webhook-secret').update(body).digest('hex'),
    ] as const;
  }
  it('creates the server total with the matching public key', async () => {
    expect(
      await service.create('customer', {
        orderId: 'order',
        method: 'RAZORPAY',
        provider: 'razorpay',
        amount: 1500,
      }),
    ).toMatchObject({
      amount: 1500,
      providerOrderId: 'order_gateway',
      razorpayKeyId: 'rzp_public',
    });
    expect(gateway.orders.create).toHaveBeenCalledWith({
      amount: 150000,
      currency: 'INR',
      receipt: 'PAY-test',
    });
  });
  it('rejects underpayment before contacting the gateway', async () => {
    await expect(
      service.create('customer', {
        orderId: 'order',
        method: 'RAZORPAY',
        provider: 'razorpay',
        amount: 1,
      }),
    ).rejects.toMatchObject({ errorCode: 'PAYMENT_AMOUNT_MISMATCH' });
    expect(gateway.orders.create).not.toHaveBeenCalled();
  });
  it('checks ownership even for an already captured payment', async () => {
    await expect(
      service.create('intruder', {
        orderId: 'order',
        method: 'RAZORPAY',
        provider: 'razorpay',
        amount: 1500,
      }),
    ).rejects.toMatchObject({ errorCode: 'ORDER_001' });
    payment.status = 'CAPTURED';
    await expect(
      service.verifyPayment('payment', 'pay_gateway', signature(), 'intruder'),
    ).rejects.toMatchObject({ errorCode: 'ORDER_001' });
    expect(workflow.capturePayment).not.toHaveBeenCalled();
  });
  it('fails closed without gateway credentials', async () => {
    settings.getByKey.mockResolvedValue('');
    await expect(
      service.create('customer', {
        orderId: 'order',
        method: 'RAZORPAY',
        provider: 'razorpay',
        amount: 1500,
      }),
    ).rejects.toMatchObject({ errorCode: 'PAYMENT_GATEWAY_UNAVAILABLE' });
    expect(db.payment.create).not.toHaveBeenCalled();
  });
  it('reuses the existing gateway order on retry', async () => {
    order.payments = [payment];
    await service.create('customer', {
      orderId: 'order',
      method: 'RAZORPAY',
      provider: 'razorpay',
      amount: 1500,
    });
    expect(gateway.orders.create).not.toHaveBeenCalled();
  });
  it('verifies provider capture before the atomic workflow', async () => {
    expect(
      (
        await service.verifyPayment(
          'payment',
          'pay_gateway',
          signature(),
          'customer',
        )
      ).status,
    ).toBe('CAPTURED');
    expect(workflow.capturePayment).toHaveBeenCalledWith(
      'payment',
      'pay_gateway',
      'customer',
      expect.objectContaining({ status: 'captured' }),
    );
  });
  it('rejects invalid signatures', async () => {
    await expect(
      service.verifyPayment('payment', 'pay_gateway', 'bad', 'customer'),
    ).rejects.toMatchObject({ errorCode: 'PAYMENT_005' });
    expect(workflow.capturePayment).not.toHaveBeenCalled();
  });
  it('keeps authorized payments awaiting capture', async () => {
    gateway.payments.fetch.mockResolvedValue({
      order_id: 'order_gateway',
      amount: 150000,
      currency: 'INR',
      status: 'authorized',
    });
    await service.verifyPayment(
      'payment',
      'pay_gateway',
      signature(),
      'customer',
    );
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'AUTHORIZED' }),
      }),
    );
    expect(workflow.capturePayment).not.toHaveBeenCalled();
  });
  it('rejects a signed callback with the wrong amount', async () => {
    gateway.payments.fetch.mockResolvedValue({
      order_id: 'order_gateway',
      amount: 100,
      currency: 'INR',
      status: 'captured',
    });
    await expect(
      service.verifyPayment('payment', 'pay_gateway', signature(), 'customer'),
    ).rejects.toMatchObject({ errorCode: 'PAYMENT_AMOUNT_MISMATCH' });
  });
  it('uses the atomic capture workflow for webhooks too', async () => {
    const [body, sig] = webhook('payment.captured', {
      id: 'pay_gateway',
      order_id: 'order_gateway',
      amount: 150000,
      currency: 'INR',
      status: 'captured',
    });
    expect(await service.handleWebhook(body, sig)).toEqual({
      status: 'processed',
    });
    expect(workflow.capturePayment).toHaveBeenCalledTimes(1);
  });
  it('protects captured payments from late failure events', async () => {
    const [body, sig] = webhook('payment.failed', {
      id: 'failed-attempt',
      order_id: 'order_gateway',
    });
    await service.handleWebhook(body, sig);
    expect(db.payment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          providerOrderId: 'order_gateway',
          status: { in: ['PENDING', 'FAILED'] },
        },
      }),
    );
  });
  it('rejects unconfigured webhook signatures', async () => {
    settings.getByKey.mockResolvedValue('');
    await expect(service.handleWebhook('{}', '')).rejects.toMatchObject({
      errorCode: 'PAYMENT_WEBHOOK_002',
    });
  });
  it('does not invent capture from a paid gateway order without a captured transaction', async () => {
    expect((await service.syncGatewayStatus('payment', 'admin')).status).toBe(
      'PENDING',
    );
    expect(workflow.capturePayment).not.toHaveBeenCalled();
  });
  it('sends a stable refund idempotency key', async () => {
    payment.providerPaymentId = 'pay_gateway';
    const mock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'refund_gateway', status: 'processed' }),
      } as any);
    try {
      await service.refundPayment('payment', 100, 'refund-record-id');
      expect(mock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Refund-Idempotency': 'refund-record-id',
          }),
        }),
      );
    } finally {
      mock.mockRestore();
    }
  });
});
