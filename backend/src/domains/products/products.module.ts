import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
