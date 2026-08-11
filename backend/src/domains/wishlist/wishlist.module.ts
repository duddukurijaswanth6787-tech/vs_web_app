import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { WishlistService } from './wishlist.service';
import { WishlistRepository } from './wishlist.repository';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [AuditModule],
  controllers: [WishlistController],
  providers: [WishlistService, WishlistRepository],
  exports: [WishlistService],
})
export class WishlistModule {}
