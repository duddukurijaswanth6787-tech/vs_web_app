import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@domains/auth/guards/jwt-auth.guard';
import { JwtService } from '@domains/auth/services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import type { JwtPayload } from '@domains/auth/services/jwt.service';
import { RagOrchestratorService } from './rag-orchestrator.service';
import { RagAgentRepository } from './rag-agent.repository';
import { ChatRequestDto, SubmitFeedbackDto } from './rag-agent.types';
import type { Request } from 'express';

@ApiTags('RAG Customer Chat')
@Controller('ai/agent')
export class RagAgentController {
  constructor(
    private readonly orchestrator: RagOrchestratorService,
    private readonly repository: RagAgentRepository,
    private readonly jwtService: JwtService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send a message to a RAG Agent' })
  async chat(@Body() dto: ChatRequestDto, @Req() req: Request) {
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const payload = this.jwtService.verify(token);
        userId = payload.sub;
      } catch {
        // Continue as guest
      }
    }

    const context = {
      userId,
      guestId: (req.headers['x-guest-id'] as string) || undefined,
    };

    const response = await this.orchestrator.orchestrate({
      agentKey: dto.agentKey,
      conversationId: dto.conversationId,
      message: dto.message,
      context,
    });

    return ResponseBuilder.created(response, 'Message processed');
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current customer conversations list' })
  async getConversations(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const results = await this.repository.findConversations({
      customerId: user.sub,
      page: Number(page),
      limit: Number(limit),
    });
    return ResponseBuilder.success(results);
  }

  @Get('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve conversation message history details' })
  async getConversationDetails(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const conv = await this.repository.findConversationById(id);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.customerId && conv.customerId !== user.sub)
      throw new ForbiddenException('Access denied');

    const messages = await this.repository.getConversationMessages({
      conversationId: id,
      page: Number(page),
      limit: Number(limit),
    });
    return ResponseBuilder.success(messages);
  }

  @Delete('conversations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive/Delete customer conversation' })
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const conv = await this.repository.findConversationById(id);
    if (!conv) throw new NotFoundException('Conversation not found');
    if (conv.customerId && conv.customerId !== user.sub)
      throw new ForbiddenException('Access denied');

    await this.repository.updateConversation(id, { status: 'ARCHIVED' });
    return ResponseBuilder.success(null, 'Conversation archived');
  }

  @Post('messages/:messageId/feedback')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Submit feedback rating comments on agent answer message',
  })
  async submitFeedback(
    @Param('messageId') messageId: string,
    @Body() dto: SubmitFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const feedback = await this.repository.addFeedback(messageId, {
      ...dto,
      userId: user.sub,
    });
    return ResponseBuilder.created(feedback, 'Feedback recorded');
  }
}
