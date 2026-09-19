import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { OrderModule } from '@domains/order/order.module';
import { ShippingController } from './shipping.controller';
import { ShippingService } from './shipping.service';
import { ShippingRepository } from './shipping.repository';
import { DelhiveryService } from './delhivery.service';

@Module({
  imports: [AuthModule, AuditModule, forwardRef(() => OrderModule)],
  controllers: [ShippingController],
  providers: [ShippingService, ShippingRepository, DelhiveryService],
  exports: [ShippingService, DelhiveryService],
})
export class ShippingModule {}
