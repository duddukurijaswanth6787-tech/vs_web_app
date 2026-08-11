import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { PackingController } from './packing.controller';
import { PackingService } from './packing.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [PackingController],
  providers: [PackingService],
  exports: [PackingService],
})
export class PackingModule {}
