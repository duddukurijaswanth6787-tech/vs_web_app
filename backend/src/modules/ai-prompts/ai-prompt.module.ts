import { Module } from '@nestjs/common';
import { AuditModule } from '@domains/audit/audit.module';
import { AiPromptController } from './ai-prompt.controller';
import { AiPromptService } from './ai-prompt.service';

@Module({
  imports: [AuditModule],
  controllers: [AiPromptController],
  providers: [AiPromptService],
})
export class AiPromptModule {}
