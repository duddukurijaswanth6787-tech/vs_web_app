import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { ProductsModule } from '@domains/products/products.module';
import { BrandsController } from './brands.controller';
import { BrandsService } from './brands.service';
import { BrandsRepository } from './brands.repository';

@Module({
  imports: [AuthModule, AuditModule, ProductsModule],
  controllers: [BrandsController],
  providers: [BrandsService, BrandsRepository],
})
export class BrandsModule {}
