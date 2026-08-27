"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const exceptions_1 = require("../../common/exceptions");
const audit_service_1 = require("../audit/audit.service");
const prisma_service_1 = require("../../database/prisma.service");
const rag_providers_service_1 = require("../rag-agent/rag-providers.service");
const ai_chat_repository_1 = require("./ai-chat.repository");
let AiChatService = AiChatService_1 = class AiChatService {
    aiChatRepository;
    auditService;
    prisma;
    configService;
    llmRegistry;
    logger = new common_1.Logger(AiChatService_1.name);
    constructor(aiChatRepository, auditService, prisma, configService, llmRegistry) {
        this.aiChatRepository = aiChatRepository;
        this.auditService = auditService;
        this.prisma = prisma;
        this.configService = configService;
        this.llmRegistry = llmRegistry;
    }
    toConversationResponse(c) {
        return {
            id: c.id,
            userId: c.userId,
            title: c.title ?? undefined,
            status: c.status,
            tokenCount: c.tokenCount,
            messages: c.messages?.map((m) => this.toMessageResponse(m)),
            createdAt: c.createdAt,
        };
    }
    toMessageResponse(m) {
        return {
            id: m.id,
            role: m.role,
            content: m.content,
            tokenCount: m.tokenCount,
            createdAt: m.createdAt,
        };
    }
    async findAll(userId, query) {
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
    async findById(id, userId) {
        const conversation = await this.aiChatRepository.findById(id);
        if (!conversation)
            throw new exceptions_1.BusinessException('Conversation not found', 'AICHAT_001');
        if (conversation.userId !== userId)
            throw new exceptions_1.BusinessException('Access denied', 'AICHAT_002');
        return this.toConversationResponse(conversation);
    }
    async create(userId, dto) {
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
    async buildCatalogContext(userMessage) {
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
                .map((p, i) => `${i + 1}. ${p.name} | ₹${Number(p.salePrice ?? p.basePrice)} | ${p.occasion ?? 'general'} | /product/${p.slug}`)
                .join('\n');
        }
        return products
            .map((p, i) => `${i + 1}. ${p.name} | ₹${Number(p.salePrice ?? p.basePrice)} | ${p.occasion ?? 'general'} | ${p.isBestSeller ? 'bestseller' : p.isNewArrival ? 'new' : 'catalog'} | /product/${p.slug}`)
            .join('\n');
    }
    async generateAssistantReply(userMessage, history) {
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
        const providerName = this.configService.get('app.rag.llmProvider') ||
            process.env.RAG_LLM_PROVIDER ||
            'gemini';
        try {
            const provider = this.llmRegistry.getProvider(providerName);
            const healthy = await provider.healthCheck();
            if (healthy) {
                const messages = [
                    { role: 'system', content: systemPrompt },
                    ...history.slice(-10).map((m) => ({
                        role: (m.role === 'ASSISTANT'
                            ? 'assistant'
                            : 'user'),
                        content: m.content,
                    })),
                    { role: 'user', content: userMessage },
                ];
                const response = await provider.chat(messages, {
                    model: this.configService.get('app.gemini.llmModel') ||
                        process.env.GEMINI_LLM_MODEL ||
                        'gemini-2.5-flash',
                    temperature: 0.4,
                    maxTokens: 700,
                    systemPrompt,
                });
                return {
                    content: response.content?.trim() ||
                        this.fallbackReply(userMessage, catalog),
                    tokenCount: (response.promptTokens ?? 0) + (response.completionTokens ?? 0),
                };
            }
        }
        catch (err) {
            this.logger.warn(`LLM unavailable, using catalog fallback: ${err?.message ?? err}`);
        }
        return {
            content: this.fallbackReply(userMessage, catalog),
            tokenCount: 0,
        };
    }
    fallbackReply(userMessage, catalog) {
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
    async sendMessage(conversationId, userId, dto) {
        const conversation = await this.aiChatRepository.findById(conversationId);
        if (!conversation)
            throw new exceptions_1.BusinessException('Conversation not found', 'AICHAT_001');
        if (conversation.userId !== userId)
            throw new exceptions_1.BusinessException('Access denied', 'AICHAT_002');
        await this.aiChatRepository.createMessage({
            conversation: { connect: { id: conversationId } },
            role: 'USER',
            content: dto.content,
            tokenCount: 0,
        });
        const history = (conversation.messages ?? []).map((m) => ({
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
    async getMessages(conversationId, userId, page = 1, limit = 20) {
        const conversation = await this.aiChatRepository.findById(conversationId);
        if (!conversation)
            throw new exceptions_1.BusinessException('Conversation not found', 'AICHAT_001');
        if (conversation.userId !== userId)
            throw new exceptions_1.BusinessException('Access denied', 'AICHAT_002');
        const result = await this.aiChatRepository.getMessages(conversationId, page, Math.min(limit, 100));
        return {
            data: result.data.map((m) => this.toMessageResponse(m)),
            meta: result.meta,
        };
    }
    async addFeedback(userId, dto) {
        const conversation = await this.aiChatRepository.findById(dto.referenceId);
        if (!conversation)
            throw new exceptions_1.BusinessException('Conversation not found', 'AICHAT_001');
        if (conversation.userId !== userId)
            throw new exceptions_1.BusinessException('Access denied', 'AICHAT_002');
        await this.auditService.log({
            action: 'AI_CHAT_FEEDBACK',
            module: 'ai-chat',
            resource: 'ai_conversation',
            resourceId: dto.referenceId,
            userId,
            newValue: { type: dto.type, rating: dto.rating, comment: dto.comment },
        });
    }
};
exports.AiChatService = AiChatService;
exports.AiChatService = AiChatService = AiChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ai_chat_repository_1.AiChatRepository,
        audit_service_1.AuditService,
        prisma_service_1.PrismaService,
        config_1.ConfigService,
        rag_providers_service_1.LlmProviderRegistry])
], AiChatService);
//# sourceMappingURL=ai-chat.service.js.map