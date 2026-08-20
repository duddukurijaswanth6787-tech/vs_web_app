import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AppSettingModule } from '@domains/app-setting/app-setting.module';
import { OtpGatewayController } from './otp-gateway.controller';
import { OtpGatewayService } from './otp-gateway.service';

@Module({
  imports: [AuthModule, AuditModule, AppSettingModule],
  controllers: [OtpGatewayController],
  providers: [OtpGatewayService],
  exports: [OtpGatewayService],
})
export class OtpGatewayModule {}
