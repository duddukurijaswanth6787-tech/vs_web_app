import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontPublicController, StorefrontPublicSettingsController } from './storefront-public.controller';
import { StorefrontService } from './storefront.service';
import { StorefrontPublicService } from './storefront-public.service';
import { AuditModule } from '@domains/audit/audit.module';
import { ProductsModule } from '@domains/products/products.module';

@Module({
  imports: [AuditModule, ProductsModule],
  controllers: [StorefrontPublicSettingsController, StorefrontController, StorefrontPublicController],
  providers: [StorefrontService, StorefrontPublicService],
})
export class StorefrontModule {}
