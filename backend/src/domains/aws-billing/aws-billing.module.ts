import { Module } from '@nestjs/common';
import { AwsBillingService } from './aws-billing.service';
import { AwsBillingController } from './aws-billing.controller';

@Module({
  controllers: [AwsBillingController],
  providers: [AwsBillingService],
  exports: [AwsBillingService],
})
export class AwsBillingModule {}
