import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AwsBillingService } from './aws-billing.service';
import { AwsBillingController } from './aws-billing.controller';

@Module({
  imports: [AuthModule],
  controllers: [AwsBillingController],
  providers: [AwsBillingService],
  exports: [AwsBillingService],
})
export class AwsBillingModule {}
