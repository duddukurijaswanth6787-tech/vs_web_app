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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const rag_agent_repository_1 = require("./rag-agent.repository");
const rag_intent_service_1 = require("./rag-intent.service");
const rag_tool_registry_1 = require("./rag-tool.registry");
const rag_retrieval_service_1 = require("./rag-retrieval.service");
const rag_prompt_builder_1 = require("./rag-prompt.builder");
const rag_providers_service_1 = require("./rag-providers.service");
const exceptions_1 = require("../../common/exceptions");
let RagOrchestratorService = class RagOrchestratorService {
    prisma;
    repository;
    intentService;
    toolRegistry;
    retrievalService;
    promptBuilder;
    llmRegistry;
    embeddingRegistry;
    logger = new common_1.Logger('RagOrchestratorService');
    constructor(prisma, repository, intentService, toolRegistry, retrievalService, promptBuilder, llmRegistry, embeddingRegistry) {
        this.prisma = prisma;
        this.repository = repository;
        this.intentService = intentService;
        this.toolRegistry = toolRegistry;
        this.retrievalService = retrievalService;
        this.promptBuilder = promptBuilder;
        this.llmRegistry = llmRegistry;
        this.embeddingRegistry = embeddingRegistry;
    }
    async orchestrate(params) {
        const startTime = Date.now();
        const { agentKey, message } = params;
        let { conversationId } = params;
        const agent = await this.repository.findByKey(agentKey);
        if (!agent) {
            throw new exceptions_1.BusinessException('RAG Agent not found', 'RAG_AGENT_001');
        }
        if (agent.status !== 'ACTIVE') {
            throw new exceptions_1.BusinessException('RAG Agent is currently inactive', 'RAG_AGENT_002');
        }
        let conversation;
        if (conversationId) {
            conversation = await this.repository.findConversationById(conversationId);
            if (!conversation) {
                throw new exceptions_1.BusinessException('Conversation not found', 'RAG_CONV_001');
            }
            if (params.context.userId && conversation.customerId) {
                const customer = await this.prisma.customerProfile.findUnique({
                    where: { userId: params.context.userId },
                });
                if (customer &&
                    conversation.customerId !== customer.id &&
                    !params.context.isAdmin) {
                    throw new exceptions_1.BusinessException('Access denied for this conversation', 'RAG_CONV_002');
                }
            }
        }
        else {
            let customerId = null;
            if (params.context.userId) {
                const customer = await this.prisma.customerProfile.findUnique({
                    where: { userId: params.context.userId },
                });
                customerId = customer?.id || null;
            }
            conversation = await this.repository.createConversation({
                agent: { connect: { id: agent.id } },
                customer: customerId ? { connect: { id: customerId } } : undefined,
                guestId: params.context.guestId || undefined,
                title: message.substring(0, 40) + '...',
            });
            conversationId = conversation.id;
        }
        const userMsg = await this.prisma.ragMessage.create({
            data: {
                conversationId: conversationId,
                role: 'user',
                content: message,
            },
        });
        const historyPage = await this.repository.getConversationMessages({
            conversationId: conversationId,
            page: 1,
            limit: 12,
        });
        const history = historyPage.data;
        const intent = this.intentService.routeIntent(message);
        const toolResults = [];
        const matchedTools = [];
        if (intent === 'ORDER_TRACKING') {
            matchedTools.push('ORDER_STATUS', 'ORDER_TRACKING');
        }
        else if (intent === 'PRODUCT_SEARCH') {
            matchedTools.push('PRODUCT_SEARCH');
        }
        else if (intent === 'PRODUCT_AVAILABILITY') {
            matchedTools.push('PRODUCT_AVAILABILITY');
        }
        else if (intent === 'RETURN_STATUS') {
            matchedTools.push('RETURN_STATUS');
        }
        else if (intent === 'REFUND_STATUS') {
            matchedTools.push('REFUND_STATUS');
        }
        const orderNumMatch = message.match(/ord-\d{8}-\d{6}/i);
        const parsedOrderNumber = orderNumMatch
            ? orderNumMatch[0].toUpperCase()
            : null;
        const configuredTools = agent.toolConfig?.tools || [];
        for (const toolName of matchedTools) {
            if (!configuredTools.includes(toolName)) {
                continue;
            }
            const tool = this.toolRegistry.getTool(toolName);
            if (!tool)
                continue;
            const toolStartTime = Date.now();
            let input = {};
            if (toolName === 'ORDER_STATUS' || toolName === 'ORDER_TRACKING') {
                input = { orderNumber: parsedOrderNumber || 'UNKNOWN' };
            }
            else if (toolName === 'PRODUCT_SEARCH') {
                input = { query: message, limit: 3 };
            }
            try {
                const result = await tool.execute(params.context, input);
                const duration = Date.now() - toolStartTime;
                toolResults.push({
                    name: toolName,
                    status: 'SUCCESS',
                    result,
                });
                await this.prisma.ragToolExecution.create({
                    data: {
                        conversationId: conversationId,
                        messageId: userMsg.id,
                        toolName,
                        status: 'SUCCESS',
                        input: input,
                        output: result,
                        durationMs: duration,
                    },
                });
            }
            catch (err) {
                toolResults.push({
                    name: toolName,
                    status: 'FAILED',
                    result: { error: err.message },
                });
                await this.prisma.ragToolExecution.create({
                    data: {
                        conversationId: conversationId,
                        messageId: userMsg.id,
                        toolName,
                        status: 'FAILED',
                        input: input,
                        errorCode: 'TOOL_ERROR',
                        errorMessage: err.message,
                    },
                });
            }
        }
        let retrievedChunks = [];
        const embeddingProvider = this.embeddingRegistry.getProvider(agent.modelProvider);
        try {
            const embedding = await embeddingProvider.embed(message, agent.model);
            retrievedChunks = await this.retrievalService.retrieve({
                agentId: agent.id,
                query: message,
                queryEmbedding: embedding,
                limit: 5,
                minScore: 0.6,
            });
        }
        catch (err) {
            this.logger.error(`Knowledge retrieval failed: ${err.message}`);
        }
        const systemPrompt = this.promptBuilder.buildSystemPrompt({
            agentName: agent.name,
            systemPrompt: agent.systemPrompt,
            instructions: agent.instructions || undefined,
        });
        const userPrompt = this.promptBuilder.buildUserPrompt({
            userMessage: message,
            retrievedChunks,
            toolResults,
        });
        const llmHistory = [
            { role: 'system', content: systemPrompt },
            ...history
                .filter((m) => m.id !== userMsg.id)
                .map((m) => ({
                role: m.role,
                content: m.content,
            })),
            { role: 'user', content: userPrompt },
        ];
        const llmProvider = this.llmRegistry.getProvider(agent.modelProvider);
        const response = await llmProvider.chat(llmHistory, {
            model: agent.model,
            temperature: Number(agent.temperature),
            maxTokens: agent.maxTokens,
        });
        const duration = Date.now() - startTime;
        const savedMsg = await this.prisma.$transaction(async (tx) => {
            const msg = await tx.ragMessage.create({
                data: {
                    conversationId: conversationId,
                    role: 'assistant',
                    content: response.content,
                    intent,
                    modelProvider: agent.modelProvider,
                    model: agent.model,
                    promptTokens: response.promptTokens,
                    completionTokens: response.completionTokens,
                    totalTokens: response.promptTokens + response.completionTokens,
                    responseTimeMs: duration,
                    confidence: 0.9,
                },
            });
            if (retrievedChunks.length > 0) {
                await tx.ragMessageCitation.createMany({
                    data: retrievedChunks.map((chunk, idx) => ({
                        messageId: msg.id,
                        knowledgeSourceId: chunk.knowledgeSourceId,
                        documentId: chunk.documentId,
                        chunkId: chunk.chunkId,
                        citationIndex: idx + 1,
                        label: chunk.metadata?.title || 'Knowledge Doc',
                        excerpt: chunk.content.substring(0, 100),
                        relevanceScore: chunk.finalScore,
                    })),
                });
            }
            await tx.ragConversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() },
            });
            return msg;
        });
        this.repository
            .incrementMetrics({
            agentId: agent.id,
            isSuccessful: true,
            responseTimeMs: duration,
            confidence: 0.9,
            promptTokens: response.promptTokens,
            completionTokens: response.completionTokens,
        })
            .catch((err) => this.logger.error(`Failed to increment metrics: ${err.message}`));
        const citations = retrievedChunks.map((chunk, idx) => ({
            index: idx + 1,
            label: chunk.metadata?.title || 'Knowledge Base',
            sourceId: chunk.knowledgeSourceId,
            excerpt: chunk.content,
            relevanceScore: chunk.finalScore,
        }));
        return {
            conversationId: conversationId,
            messageId: savedMsg.id,
            answer: response.content,
            intent,
            confidence: 0.9,
            citations,
            products: [],
            toolsUsed: toolResults.map((tr) => ({
                name: tr.name,
                status: tr.status,
            })),
            suggestedActions: parsedOrderNumber
                ? [
                    {
                        type: 'VIEW_ORDER',
                        label: 'View Order',
                        entityId: parsedOrderNumber,
                    },
                ]
                : [],
            responseTimeMs: duration,
        };
    }
};
exports.RagOrchestratorService = RagOrchestratorService;
exports.RagOrchestratorService = RagOrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rag_agent_repository_1.RagAgentRepository,
        rag_intent_service_1.RagIntentService,
        rag_tool_registry_1.RagToolRegistry,
        rag_retrieval_service_1.RagRetrievalService,
        rag_prompt_builder_1.RagPromptBuilder,
        rag_providers_service_1.LlmProviderRegistry,
        rag_providers_service_1.EmbeddingProviderRegistry])
], RagOrchestratorService);
//# sourceMappingURL=rag-orchestrator.service.js.map