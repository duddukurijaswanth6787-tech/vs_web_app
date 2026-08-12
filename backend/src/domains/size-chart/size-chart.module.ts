import { Module } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { SizeChartController } from './size-chart.controller';
import { SizeChartService } from './size-chart.service';
import { SizeChartRepository } from './size-chart.repository';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SizeChartController],
  providers: [SizeChartService, SizeChartRepository],
  exports: [SizeChartService],
})
export class SizeChartModule {}
