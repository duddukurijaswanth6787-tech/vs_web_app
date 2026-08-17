import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { CartService } from '@domains/cart/cart.service';
import { CouponService } from '@domains/coupon/coupon.service';
import { OfferService } from '@domains/offer/offer.service';
import { OrderWorkflowService } from '@domains/order/order-workflow.service';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';

describe('CheckoutService', () => {
  let service: CheckoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: CartService,
          useValue: { getCartByUser: jest.fn() },
        },
        {
          provide: CouponService,
          useValue: { validate: jest.fn() },
        },
        {
          provide: OfferService,
          useValue: { findBestOfferForCart: jest.fn() },
        },
        {
          provide: OrderWorkflowService,
          useValue: {
            generateOrderNumber: jest.fn(),
            reserveInventory: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb) =>
              cb({
                order: { create: jest.fn() },
                orderTimeline: { create: jest.fn() },
              }),
            ),
            order: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
