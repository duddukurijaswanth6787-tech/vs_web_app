import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { OtpModule } from '@domains/otp/otp.module';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerProfileRepository } from './customer-profile.repository';
import { PhoneChangeService } from './phone-change.service';

@Module({
  // OtpModule supplies the same send/verify used by OTP login, so a phone
  // change reuses that delivery and rate-limiting rather than duplicating it.
  imports: [AuditModule, OtpModule],
  providers: [CustomerProfileService, CustomerProfileRepository, PhoneChangeService],
  exports: [CustomerProfileService, CustomerProfileRepository, PhoneChangeService],
})
export class CustomerProfileModule {}
