import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { CartModule } from '@domains/cart/cart.module';
import { CouponModule } from '@domains/coupon/coupon.module';
import { OfferModule } from '@domains/offer/offer.module';
import { OrderModule } from '@domains/order/order.module';
import { EmailModule } from '@domains/email/email.module';
import { OtpGatewayModule } from '@domains/otp-gateway/otp-gateway.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [
    AuthModule,
    AuditModule,
    CartModule,
    CouponModule,
    OfferModule,
    OrderModule,
    EmailModule,
    OtpGatewayModule,
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService],
})
export class CheckoutModule {}
