import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database/database.module';
import { OrderModule } from '@domains/order/order.module';
import { AuditModule } from '@domains/audit/audit.module';
import { CouponModule } from '@domains/coupon/coupon.module';
import { GiftCardModule } from '@domains/gift-card/gift-card.module';
import { LoyaltyModule } from '@domains/loyalty/loyalty.module';
import { AuthModule } from '@domains/auth/auth.module';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PosRepository } from './pos.repository';
import { PosGateway } from './pos.gateway';
import { BarcodeService } from './barcode.service';
import { PrinterService } from './printer.service';

@Module({
  imports: [DatabaseModule, OrderModule, AuditModule, CouponModule, GiftCardModule, LoyaltyModule, AuthModule],
  controllers: [PosController],
  providers: [
    PosRepository,
    PosService,
    PosGateway,
    BarcodeService,
    PrinterService,
  ],
  exports: [PosService, PosGateway, BarcodeService, PrinterService],
})
export class PosModule {}
