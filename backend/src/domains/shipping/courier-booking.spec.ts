import { DelhiveryService } from './delhivery.service';
import { DtdcService } from '@domains/dtdc/dtdc.service';

describe('Courier booking truthfulness', () => {
  let service: DelhiveryService, db: any, order: any;
  const dto = {
    orderId: 'order',
    name: 'Test',
    address: 'Test address',
    pin: '500001',
    phone: '9000000000',
    paymentMode: 'Prepaid',
  } as any;
  beforeEach(() => {
    order = {
      id: 'order',
      status: 'READY_TO_SHIP',
      grandTotal: 100,
      payments: [{ amount: 100, status: 'CAPTURED', method: 'RAZORPAY' }],
    };
    db = { order: { findFirst: jest.fn(async () => order) } };
    service = new DelhiveryService(
      { get: jest.fn().mockReturnValue('test-only-token') } as any,
      db,
      {} as any,
    );
  });
  afterEach(() => jest.restoreAllMocks());
  it('rejects unpaid booking even if the caller switches payment mode to COD', async () => {
    order.payments = [];
    const mock = jest.spyOn(global, 'fetch');
    await expect(
      service.createShipment({ ...dto, paymentMode: 'COD' }),
    ).rejects.toMatchObject({ errorCode: 'DISPATCH_BLOCKED_UNPAID' });
    expect(mock).not.toHaveBeenCalled();
  });
  it('does not generate an AWB when the courier rejects booking', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as any);
    await expect(service.createShipment(dto)).rejects.toMatchObject({
      errorCode: 'SHIPPING_BOOKING_FAILED',
    });
  });
  it('returns only an actual accepted courier AWB', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          packages: [{ waybill: 'REAL-COURIER-AWB', status: 'Success' }],
        }),
      } as any);
    expect(await service.createShipment(dto)).toMatchObject({
      waybill: 'REAL-COURIER-AWB',
      success: true,
    });
  });
  it('does not fake a scheduled pickup after a failed carrier response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as any);
    await expect(
      service.requestPickup({
        pickupLocation: 'Test warehouse',
        pickupDate: '2026-10-18',
        expectedPackageCount: 1,
      }),
    ).rejects.toMatchObject({ errorCode: 'SHIPPING_PICKUP_FAILED' });
  });
  it('reports unavailable tracking honestly', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as any);
    expect(await service.trackShipment('real-awb')).toMatchObject({
      status: 'Tracking unavailable',
    });
  });
  it('blocks the unfinished DTDC adapter instead of generating a mock booking', async () => {
    const dtdc = new DtdcService(db, {} as any, {} as any);
    await expect(
      dtdc.createShipment({ orderId: 'order' } as any, 'admin'),
    ).rejects.toMatchObject({ errorCode: 'DTDC_NOT_CONFIGURED' });
  });
});
