import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
