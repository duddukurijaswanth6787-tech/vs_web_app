import { Module } from '@nestjs/common';
import { StorefrontController } from './storefront.controller';
import { StorefrontPublicController } from './storefront-public.controller';
import { StorefrontService } from './storefront.service';
import { ThemeService } from './theme.service';
import { StorefrontPublicService } from './storefront-public.service';
import { AuditModule } from '@domains/audit/audit.module';
import { ProductsModule } from '@domains/products/products.module';

@Module({
  imports: [AuditModule, ProductsModule],
  controllers: [StorefrontController, StorefrontPublicController],
  providers: [ThemeService, StorefrontService, StorefrontPublicService],
})
export class StorefrontModule {}
