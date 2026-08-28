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
exports.RagAgentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const rag_agent_repository_1 = require("./rag-agent.repository");
const audit_service_1 = require("../audit/audit.service");
const rag_orchestrator_service_1 = require("./rag-orchestrator.service");
let RagAgentService = class RagAgentService {
    prisma;
    repository;
    orchestrator;
    auditService;
    logger = new common_1.Logger('RagAgentService');
    constructor(prisma, repository, orchestrator, auditService) {
        this.prisma = prisma;
        this.repository = repository;
        this.orchestrator = orchestrator;
        this.auditService = auditService;
    }
    async onModuleInit() {
        await this.seedDefaultAgents();
    }
    async seedDefaultAgents() {
        const defaultAgents = [
            {
                agentKey: 'customer_support_agent',
                name: 'Customer Support Agent',
                description: 'Handles support questions, order updates, returns, and general inquiries.',
                systemPrompt: 'You are the customer support representative. Assist with order statuses, delivery, returns, and store policies.',
                toolConfig: {
                    tools: [
                        'ORDER_STATUS',
                        'ORDER_TRACKING',
                        'RETURN_STATUS',
                        'REFUND_STATUS',
                    ],
                },
            },
            {
                agentKey: 'product_recommendation_agent',
                name: 'Product Recommendation Agent',
                description: 'Helps customers discover products, compare styles, and search catalog items.',
                systemPrompt: 'You are a product shopping guide. Recommend outfits, search sizes/colors, and find products.',
                toolConfig: {
                    tools: ['PRODUCT_SEARCH', 'PRODUCT_DETAILS', 'PRODUCT_AVAILABILITY'],
                },
            },
            {
                agentKey: 'order_tracking_agent',
                name: 'Order Tracking Agent',
                description: 'Exclusively tracks order shipments, delivery timelines, and transit updates.',
                systemPrompt: 'You are the shipping assistant. Guide customers on where their package is and when it will arrive.',
                toolConfig: { tools: ['ORDER_STATUS', 'ORDER_TRACKING'] },
            },
            {
                agentKey: 'faq_agent',
                name: 'FAQ & Policies Agent',
                description: 'Answers policy inquiries, payment methods, shipping fees, and general FAQs.',
                systemPrompt: 'You are a general knowledge base helper. Guide customers on store procedures, payment rules, and FAQ listings.',
                toolConfig: { tools: [] },
            },
            {
                agentKey: 'returns_refunds_agent',
                name: 'Returns & Refunds Specialist',
                description: 'Validates return requests, return eligibility, and refund timeline updates.',
                systemPrompt: 'You are the returns validator. Answer eligibility details and look up return request status records.',
                toolConfig: { tools: ['RETURN_STATUS', 'REFUND_STATUS'] },
            },
            {
                agentKey: 'styling_fashion_agent',
                name: 'Styling & Fashion Expert',
                description: 'Provides personalized styling, occasion wear matching, and trend advice.',
                systemPrompt: 'You are a premium luxury fashion designer assistant. Advise on styling matching colors, bridal themes, and luxury kurtis.',
                toolConfig: { tools: ['PRODUCT_SEARCH', 'PRODUCT_DETAILS'] },
            },
        ];
        for (const agent of defaultAgents) {
            const existing = await this.prisma.ragAgent.findUnique({
                where: { agentKey: agent.agentKey },
            });
            if (!existing) {
                await this.prisma.ragAgent.create({
                    data: {
                        ...agent,
                        isDefault: true,
                        status: 'ACTIVE',
                        createdBy: 'SYSTEM',
                        behaviorConfig: {},
                        guardrailConfig: {},
                    },
                });
                this.logger.log(`Seeded default RAG agent: ${agent.agentKey}`);
            }
        }
    }
    async findAll(page, limit) {
        return this.repository.findAll({ page, limit });
    }
    async findById(id) {
        const agent = await this.repository.findById(id);
        if (!agent)
            throw new common_1.NotFoundException('RAG Agent not found');
        return agent;
    }
    async create(dto, userId) {
        const agent = await this.repository.create({
            ...dto,
            temperature: dto.temperature ?? 0.7,
            behaviorConfig: dto.behaviorConfig || {},
            toolConfig: dto.toolConfig || {},
            guardrailConfig: dto.guardrailConfig || {},
            createdBy: userId,
        });
        await this.auditService.log({
            userId,
            action: 'CREATE',
            module: 'RAG_AGENT',
            resource: 'RAG',
            resourceId: agent.id,
            metadata: { agentKey: agent.agentKey },
        });
        return agent;
    }
    async update(id, dto, userId) {
        await this.findById(id);
        const updated = await this.repository.update(id, {
            ...dto,
            temperature: dto.temperature !== undefined ? dto.temperature : undefined,
            behaviorConfig: dto.behaviorConfig || undefined,
            toolConfig: dto.toolConfig || undefined,
            guardrailConfig: dto.guardrailConfig || undefined,
            updatedBy: userId,
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            module: 'RAG_AGENT',
            resource: 'RAG',
            resourceId: id,
        });
        return updated;
    }
    async softDelete(id, userId) {
        await this.findById(id);
        const agent = await this.repository.softDelete(id);
        await this.auditService.log({
            userId,
            action: 'DELETE',
            module: 'RAG_AGENT',
            resource: 'RAG',
            resourceId: id,
        });
        return agent;
    }
    async restore(id, userId) {
        await this.repository.restore(id);
        await this.auditService.log({
            userId,
            action: 'RESTORE',
            module: 'RAG_AGENT',
            resource: 'RAG',
            resourceId: id,
        });
        return { success: true };
    }
    async updateStatus(id, action, userId) {
        await this.findById(id);
        const status = action === 'ACTIVATE' ? 'ACTIVE' : 'INACTIVE';
        const agent = await this.repository.update(id, {
            status,
            updatedBy: userId,
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE_STATUS',
            module: 'RAG_AGENT',
            resource: 'RAG',
            resourceId: id,
            metadata: { status },
        });
        return agent;
    }
    async assignKnowledgeSources(id, dto, userId) {
        await this.findById(id);
        const agent = await this.repository.assignKnowledgeSources(id, dto.knowledgeSourceIds);
        await this.auditService.log({
            userId,
            action: 'ASSIGN_KNOWLEDGE',
            module: 'RAG_AGENT',
            resource: 'RAG',
            resourceId: id,
            metadata: { sourceIds: dto.knowledgeSourceIds },
        });
        return agent;
    }
    async configureTools(id, dto, userId) {
        await this.findById(id);
        const agent = await this.repository.update(id, {
            toolConfig: { tools: dto.tools },
            updatedBy: userId,
        });
        await this.auditService.log({
            userId,
            action: 'CONFIGURE_TOOLS',
            module: 'RAG_AGENT',
            resource: 'RAG',
            resourceId: id,
            metadata: { tools: dto.tools },
        });
        return agent;
    }
    async testAgent(id, dto) {
        const agent = await this.findById(id);
        return this.orchestrator.orchestrate({
            agentKey: agent.agentKey,
            message: dto.message,
            context: { isAdmin: true },
        });
    }
};
exports.RagAgentService = RagAgentService;
exports.RagAgentService = RagAgentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rag_agent_repository_1.RagAgentRepository,
        rag_orchestrator_service_1.RagOrchestratorService,
        audit_service_1.AuditService])
], RagAgentService);
//# sourceMappingURL=rag-agent.service.js.map