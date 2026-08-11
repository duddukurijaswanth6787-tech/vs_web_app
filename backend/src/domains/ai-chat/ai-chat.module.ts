import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '@domains/auth/auth.module';
import { AuditModule } from '@domains/audit/audit.module';
import { RagAgentModule } from '@domains/rag-agent/rag-agent.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AiChatRepository } from './ai-chat.repository';

@Module({
  imports: [AuthModule, AuditModule, forwardRef(() => RagAgentModule)],
  controllers: [AiChatController],
  providers: [AiChatService, AiChatRepository],
})
export class AiChatModule {}
