import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { CartController } from './cart.controller';

@Module({
  imports: [AuditModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService],
})
export class CartModule {}
