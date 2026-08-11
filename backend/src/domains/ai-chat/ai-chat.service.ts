import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessException } from '@common/exceptions';
import { AuditService } from '@domains/audit/audit.service';
import { PrismaService } from '@database/prisma.service';
import { LlmProviderRegistry } from '@domains/rag-agent/rag-providers.service';
import { AiChatRepository } from './ai-chat.repository';
import {
  CreateConversationDto,
  SendMessageDto,
  ConversationQueryDto,
  AiConversationResponse,
  AiMessageResponse,
  AddFeedbackDto,
} from './ai-chat.types';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly aiChatRepository: AiChatRepository,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly llmRegistry: LlmProviderRegistry,
  ) {}

  private toConversationResponse(c: any): AiConversationResponse {
    return {
      id: c.id,
      userId: c.userId,
      title: c.title ?? undefined,
      status: c.status,
      tokenCount: c.tokenCount,
      messages: c.messages?.map((m: any) => this.toMessageResponse(m)),
      createdAt: c.createdAt,
    };
  }

  private toMessageResponse(m: any): AiMessageResponse {
    return {
      id: m.id,
      role: m.role,
      content: m.content,
      tokenCount: m.tokenCount,
      createdAt: m.createdAt,
    };
  }

  async findAll(userId: string, query: ConversationQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const result = await this.aiChatRepository.findAll({
      userId,
      status: query.status,
      page,
      limit,
    });
    return {
      data: result.data.map((c) => this.toConversationResponse(c)),
      meta: result.meta,
    };
  }

  async findById(id: string, userId: string) {
    const conversation = await this.aiChatRepository.findById(id);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');
    return this.toConversationResponse(conversation);
  }

  async create(userId: string, dto: CreateConversationDto) {
    const conversation = await this.aiChatRepository.create({
      user: { connect: { id: userId } },
      title: dto.title,
      status: 'ACTIVE',
      tokenCount: 0,
    });
    await this.auditService.log({
      action: 'AI_CHAT_STARTED',
      module: 'ai-chat',
      resource: 'ai_conversation',
      resourceId: conversation.id,
      userId,
      newValue: { title: dto.title },
    });
    return this.toConversationResponse(conversation);
  }

  private async buildCatalogContext(userMessage: string): Promise<string> {
    const q = userMessage.trim().slice(0, 120);
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        isPublished: true,
        visibility: 'VISIBLE',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          {
            tags: {
              hasSome: q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5),
            },
          },
          { shortDescription: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 8,
      orderBy: [
        { isBestSeller: 'desc' },
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        name: true,
        slug: true,
        basePrice: true,
        salePrice: true,
        shortDescription: true,
        gender: true,
        occasion: true,
        isBestSeller: true,
        isNewArrival: true,
      },
    });

    if (!products.length) {
      const fallback = await this.prisma.product.findMany({
        where: { deletedAt: null, isPublished: true, visibility: 'VISIBLE' },
        take: 6,
        orderBy: [{ isBestSeller: 'desc' }, { isFeatured: 'desc' }],
        select: {
          name: true,
          slug: true,
          basePrice: true,
          salePrice: true,
          shortDescription: true,
          occasion: true,
        },
      });
      if (!fallback.length)
        return 'No products currently available in catalog.';
      return fallback
        .map(
          (p, i) =>
            `${i + 1}. ${p.name} | ₹${Number(p.salePrice ?? p.basePrice)} | ${p.occasion ?? 'general'} | /product/${p.slug}`,
        )
        .join('\n');
    }

    return products
      .map(
        (p, i) =>
          `${i + 1}. ${p.name} | ₹${Number(p.salePrice ?? p.basePrice)} | ${p.occasion ?? 'general'} | ${p.isBestSeller ? 'bestseller' : p.isNewArrival ? 'new' : 'catalog'} | /product/${p.slug}`,
      )
      .join('\n');
  }

  private async generateAssistantReply(
    userMessage: string,
    history: { role: string; content: string }[],
  ): Promise<{ content: string; tokenCount: number }> {
    const catalog = await this.buildCatalogContext(userMessage);
    const systemPrompt = [
      "You are the shopping assistant for Vasanthi Designers, a premium Indian women's fashion store (sarees, lehengas, kurtis, gowns, ethnic wear).",
      'Be helpful, concise, and product-aware. Suggest relevant items from the catalog context when possible.',
      'If asked about orders/returns/shipping, give clear store-policy style guidance.',
      'Never invent fake product IDs. Use product names and links from catalog context.',
      '',
      'Catalog context:',
      catalog,
    ].join('\n');

    const providerName =
      this.configService.get<string>('app.rag.llmProvider') ||
      process.env.RAG_LLM_PROVIDER ||
      'gemini';

    try {
      const provider = this.llmRegistry.getProvider(providerName);
      const healthy = await provider.healthCheck();
      if (healthy) {
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...history.slice(-10).map((m) => ({
            role: m.role === 'ASSISTANT' ? 'assistant' : 'user',
            content: m.content,
          })),
          { role: 'user' as const, content: userMessage },
        ];
        const response = await provider.chat(messages, {
          model:
            this.configService.get<string>('app.gemini.llmModel') ||
            process.env.GEMINI_LLM_MODEL ||
            'gemini-2.5-flash',
          temperature: 0.4,
          maxTokens: 700,
          systemPrompt,
        });
        return {
          content:
            response.content?.trim() ||
            this.fallbackReply(userMessage, catalog),
          tokenCount:
            (response.promptTokens ?? 0) + (response.completionTokens ?? 0),
        };
      }
    } catch (err: any) {
      this.logger.warn(
        `LLM unavailable, using catalog fallback: ${err?.message ?? err}`,
      );
    }

    return {
      content: this.fallbackReply(userMessage, catalog),
      tokenCount: 0,
    };
  }

  private fallbackReply(userMessage: string, catalog: string): string {
    const lower = userMessage.toLowerCase();
    if (/(return|refund|exchange)/.test(lower)) {
      return 'You can request a return/exchange from My Orders within our return window. Open the order → Return, choose a reason, and submit. Our team will review and arrange pickup if eligible.';
    }
    if (/(ship|delivery|track)/.test(lower)) {
      return 'Standard delivery usually takes 3–5 business days. You can track your order from My Orders → Track. For urgent help, share your order number.';
    }
    if (/(hello|hi|hey|namaste)/.test(lower)) {
      return 'Namaste! Welcome to Vasanthi Designers. I can help you find sarees, lehengas, kurtis, and festive wear. What are you looking for today?';
    }
    const lines = catalog
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('No products'))
      .slice(0, 4);
    if (lines.length) {
      return [
        `I found some pieces that may match “${userMessage.trim()}”:`,
        ...lines.map((l) => `• ${l}`),
        'Tell me your occasion, budget, or preferred color and I can narrow it further.',
      ].join('\n');
    }
    return 'I can help you shop Vasanthi Designers collections — sarees, lehengas, kurtis, and more. Share an occasion, style, or budget to get recommendations.';
  }

  async sendMessage(
    conversationId: string,
    userId: string,
    dto: SendMessageDto,
  ) {
    const conversation = await this.aiChatRepository.findById(conversationId);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');

    await this.aiChatRepository.createMessage({
      conversation: { connect: { id: conversationId } },
      role: 'USER',
      content: dto.content,
      tokenCount: 0,
    });

    const history = (conversation.messages ?? []).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));
    const reply = await this.generateAssistantReply(dto.content, history);

    const aiMessage = await this.aiChatRepository.createMessage({
      conversation: { connect: { id: conversationId } },
      role: 'ASSISTANT',
      content: reply.content,
      tokenCount: reply.tokenCount,
    });

    await this.aiChatRepository.update(conversationId, {
      tokenCount: { increment: reply.tokenCount || 1 },
      ...(conversation.title ? {} : { title: dto.content.slice(0, 60) }),
    });

    await this.auditService.log({
      action: 'AI_CHAT_COMPLETED',
      module: 'ai-chat',
      resource: 'ai_conversation',
      resourceId: conversationId,
      userId,
    });

    return this.toMessageResponse(aiMessage);
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 20,
  ) {
    const conversation = await this.aiChatRepository.findById(conversationId);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');

    const result = await this.aiChatRepository.getMessages(
      conversationId,
      page,
      Math.min(limit, 100),
    );
    return {
      data: result.data.map((m) => this.toMessageResponse(m)),
      meta: result.meta,
    };
  }

  async addFeedback(userId: string, dto: AddFeedbackDto) {
    const conversation = await this.aiChatRepository.findById(dto.referenceId);
    if (!conversation)
      throw new BusinessException('Conversation not found', 'AICHAT_001');
    if (conversation.userId !== userId)
      throw new BusinessException('Access denied', 'AICHAT_002');

    await this.auditService.log({
      action: 'AI_CHAT_FEEDBACK',
      module: 'ai-chat',
      resource: 'ai_conversation',
      resourceId: dto.referenceId,
      userId,
      newValue: { type: dto.type, rating: dto.rating, comment: dto.comment },
    });
  }
}
