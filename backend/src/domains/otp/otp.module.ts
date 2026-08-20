import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { OtpGatewayModule } from '@domains/otp-gateway/otp-gateway.module';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

@Module({
  imports: [AuthModule, AuditModule, OtpGatewayModule],
  controllers: [OtpController],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
