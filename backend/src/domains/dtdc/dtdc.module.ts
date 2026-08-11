import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { DtdcController } from './dtdc.controller';
import { DtdcService } from './dtdc.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [DtdcController],
  providers: [DtdcService],
  exports: [DtdcService],
})
export class DtdcModule {}
