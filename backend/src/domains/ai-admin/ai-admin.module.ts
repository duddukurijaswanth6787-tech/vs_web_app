import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { AiAdminController } from './ai-admin.controller';
import { AiAdminService } from './ai-admin.service';
import { AiAdminRepository } from './ai-admin.repository';
import { ProductCopilotController } from './product-copilot.controller';
import { ProductCopilotService } from './product-copilot.service';

@Module({
  imports: [ConfigModule, AuthModule, AuditModule],
  controllers: [AiAdminController, ProductCopilotController],
  providers: [AiAdminService, AiAdminRepository, ProductCopilotService],
  exports: [ProductCopilotService],
})
export class AiAdminModule {}

