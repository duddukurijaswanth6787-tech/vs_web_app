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
exports.RagAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const rag_agent_repository_1 = require("./rag-agent.repository");
let RagAnalyticsController = class RagAnalyticsController {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getSummary() {
        const summary = await this.repository.getSummaryAnalytics();
        return response_builder_1.ResponseBuilder.success(summary);
    }
    async getAgentAnalytics(agentId) {
        const analytics = await this.repository.getAgentPerformanceSummary(agentId);
        return response_builder_1.ResponseBuilder.success(analytics);
    }
    async getIntents() {
        return response_builder_1.ResponseBuilder.success([
            { intent: 'PRODUCT_SEARCH', count: 12 },
            { intent: 'ORDER_TRACKING', count: 8 },
            { intent: 'RETURN_POLICY', count: 5 },
            { intent: 'FAQ', count: 3 },
        ]);
    }
    async getConversations(page = 1, limit = 10) {
        const data = await this.repository.findConversations({
            page: Number(page),
            limit: Number(limit),
        });
        return response_builder_1.ResponseBuilder.success(data);
    }
    async getConversationDetails(id, page = 1, limit = 20) {
        const conversation = await this.repository.findConversationById(id);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const messages = await this.repository.getConversationMessages({
            conversationId: id,
            page: Number(page),
            limit: Number(limit),
        });
        return response_builder_1.ResponseBuilder.success({
            conversation,
            messages,
        });
    }
};
exports.RagAnalyticsController = RagAnalyticsController;
__decorate([
    (0, common_1.Get)('analytics/summary'),
    (0, swagger_1.ApiOperation)({ summary: 'Get general performance summary of RAG agents' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RagAnalyticsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Get)('analytics/agents/:agentId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detail metrics for a specific agent' }),
    __param(0, (0, common_1.Param)('agentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RagAnalyticsController.prototype, "getAgentAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/intents'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get summary counts of classified user message intents',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RagAnalyticsController.prototype, "getIntents", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: 'Inspect all conversations across the system' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RagAnalyticsController.prototype, "getConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Inspect details and messages inside a specific conversation',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RagAnalyticsController.prototype, "getConversationDetails", null);
exports.RagAnalyticsController = RagAnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('RAG Analytics Admin'),
    (0, common_1.Controller)('admin/rag'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rag_agent_repository_1.RagAgentRepository])
], RagAnalyticsController);
//# sourceMappingURL=rag-analytics.controller.js.map