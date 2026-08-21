import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { OrderModule } from '@domains/order/order.module';
import { AppSettingModule } from '@domains/app-setting/app-setting.module';
import { PaymentController } from './payment.controller';
import { PaymentMethodsController } from './payment-methods.controller';
import { PaymentSettingsController } from './payment-settings.controller';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';

@Module({
  imports: [ConfigModule, AuthModule, AuditModule, OrderModule, AppSettingModule],
  controllers: [PaymentMethodsController, PaymentController, PaymentSettingsController],
  providers: [PaymentService, PaymentRepository],
  exports: [PaymentService],
})
export class PaymentModule {}
