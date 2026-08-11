import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { GiftCardController } from './gift-card.controller';
import { GiftCardService } from './gift-card.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [GiftCardController],
  providers: [GiftCardService],
  exports: [GiftCardService],
})
export class GiftCardModule {}
