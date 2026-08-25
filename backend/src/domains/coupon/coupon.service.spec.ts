import { CouponService } from './coupon.service';
import { CouponRepository } from './coupon.repository';
import { CouponType } from './coupon.types';

describe('CouponService - usage limit race guard', () => {
  const baseCoupon = {
    id: 'coupon-1',
    code: 'SAVE10',
    isActive: true,
    startDate: new Date(Date.now() - 1000),
    endDate: new Date(Date.now() + 1000 * 60 * 60),
    usageLimit: 1,
    perCustomerLimit: 5,
    minOrderAmount: null,
    maxDiscountAmount: null,
    applicableTo: null,
    type: CouponType.FLAT,
    value: 100,
  };

  function makeService(usageCount: number) {
    const repo = {
      findByCode: jest.fn().mockResolvedValue(baseCoupon),
      lockCouponByCode: jest.fn().mockResolvedValue(undefined),
      getUsageCount: jest.fn().mockResolvedValue(usageCount),
      createUsage: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    } as unknown as CouponRepository;
    const audit = { log: jest.fn() } as any;
    const prisma = { $transaction: jest.fn((cb: any) => cb({})) } as any;
    const service = new CouponService(repo, audit, prisma);
    return { service, repo };
  }

  it('locks the coupon row and rejects once the usage limit is already reached', async () => {
    const { service, repo } = makeService(1);

    await expect(
      service.applyCoupon('user-1', {
        code: 'SAVE10',
        orderId: 'order-1',
        orderAmount: 500,
      }),
    ).rejects.toThrow('Coupon usage limit reached');

    expect(repo.lockCouponByCode).toHaveBeenCalledWith(
      'SAVE10',
      expect.anything(),
    );
    expect(repo.createUsage).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('applies the coupon and records usage when under the limit', async () => {
    const { service, repo } = makeService(0);

    const result = await service.applyCoupon('user-1', {
      code: 'SAVE10',
      orderId: 'order-1',
      orderAmount: 500,
    });

    expect(result.discountAmount).toBe(100);
    expect(repo.createUsage).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledWith(
      'coupon-1',
      { usedCount: { increment: 1 } },
      expect.anything(),
    );
  });
});
