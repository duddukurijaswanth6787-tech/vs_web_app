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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RagAgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const jwt_service_1 = require("../auth/services/jwt.service");
const response_builder_1 = require("../../common/responses/response.builder");
const rag_orchestrator_service_1 = require("./rag-orchestrator.service");
const rag_agent_repository_1 = require("./rag-agent.repository");
const rag_agent_types_1 = require("./rag-agent.types");
let RagAgentController = class RagAgentController {
    orchestrator;
    repository;
    jwtService;
    constructor(orchestrator, repository, jwtService) {
        this.orchestrator = orchestrator;
        this.repository = repository;
        this.jwtService = jwtService;
    }
    async chat(dto, req) {
        let userId;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const payload = this.jwtService.verify(token);
                userId = payload.sub;
            }
            catch {
            }
        }
        const context = {
            userId,
            guestId: req.headers['x-guest-id'] || undefined,
        };
        const response = await this.orchestrator.orchestrate({
            agentKey: dto.agentKey,
            conversationId: dto.conversationId,
            message: dto.message,
            context,
        });
        return response_builder_1.ResponseBuilder.created(response, 'Message processed');
    }
    async getConversations(user, page = 1, limit = 10) {
        const results = await this.repository.findConversations({
            customerId: user.sub,
            page: Number(page),
            limit: Number(limit),
        });
        return response_builder_1.ResponseBuilder.success(results);
    }
    async getConversationDetails(id, user, page = 1, limit = 20) {
        const conv = await this.repository.findConversationById(id);
        if (!conv) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const customer = await this.repository.findConversations({
            customerId: user.sub,
            page: 1,
            limit: 1,
        });
        if (conv.customerId && conv.customerId !== customer.data[0]?.customerId) {
            throw new common_1.ForbiddenException('Access denied');
        }
        const messages = await this.repository.getConversationMessages({
            conversationId: id,
            page: Number(page),
            limit: Number(limit),
        });
        return response_builder_1.ResponseBuilder.success(messages);
    }
    async deleteConversation(id) {
        const conv = await this.repository.findConversationById(id);
        if (!conv) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        await this.repository.updateConversation(id, { status: 'ARCHIVED' });
        return response_builder_1.ResponseBuilder.success(null, 'Conversation archived');
    }
    async submitFeedback(messageId, dto, user) {
        const feedback = await this.repository.addFeedback(messageId, {
            ...dto,
            userId: user.sub,
        });
        return response_builder_1.ResponseBuilder.created(feedback, 'Feedback recorded');
    }
};
exports.RagAgentController = RagAgentController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message to a RAG Agent' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rag_agent_types_1.ChatRequestDto, Object]),
    __metadata("design:returntype", Promise)
], RagAgentController.prototype, "chat", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current customer conversations list' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RagAgentController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve conversation message history details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RagAgentController.prototype, "getConversationDetails", null);
__decorate([
    (0, common_1.Delete)('conversations/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Archive/Delete customer conversation' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RagAgentController.prototype, "deleteConversation", null);
__decorate([
    (0, common_1.Post)('messages/:messageId/feedback'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Submit feedback rating comments on agent answer message',
    }),
    __param(0, (0, common_1.Param)('messageId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rag_agent_types_1.SubmitFeedbackDto, Object]),
    __metadata("design:returntype", Promise)
], RagAgentController.prototype, "submitFeedback", null);
exports.RagAgentController = RagAgentController = __decorate([
    (0, swagger_1.ApiTags)('RAG Customer Chat'),
    (0, common_1.Controller)('ai/agent'),
    __metadata("design:paramtypes", [rag_orchestrator_service_1.RagOrchestratorService,
        rag_agent_repository_1.RagAgentRepository,
        jwt_service_1.JwtService])
], RagAgentController);
//# sourceMappingURL=rag-agent.controller.js.map