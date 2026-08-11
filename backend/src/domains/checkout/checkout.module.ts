import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { CartModule } from '@domains/cart/cart.module';
import { CouponModule } from '@domains/coupon/coupon.module';
import { OrderModule } from '@domains/order/order.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [AuthModule, AuditModule, CartModule, CouponModule, OrderModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
