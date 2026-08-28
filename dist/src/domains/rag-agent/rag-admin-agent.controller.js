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
exports.RagAdminAgentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const rag_agent_service_1 = require("./rag-agent.service");
const rag_agent_types_1 = require("./rag-agent.types");
let RagAdminAgentController = class RagAdminAgentController {
    agentService;
    constructor(agentService) {
        this.agentService = agentService;
    }
    async findAll(page = 1, limit = 10) {
        const data = await this.agentService.findAll(Number(page), Number(limit));
        return response_builder_1.ResponseBuilder.success(data);
    }
    async findById(id) {
        const data = await this.agentService.findById(id);
        return response_builder_1.ResponseBuilder.success(data);
    }
    async create(dto, user) {
        const data = await this.agentService.create(dto, user.sub);
        return response_builder_1.ResponseBuilder.created(data, 'Agent created');
    }
    async update(id, dto, user) {
        const data = await this.agentService.update(id, dto, user.sub);
        return response_builder_1.ResponseBuilder.success(data, 'Agent updated');
    }
    async delete(id, user) {
        await this.agentService.softDelete(id, user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Agent soft deleted');
    }
    async restore(id, user) {
        await this.agentService.restore(id, user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Agent restored');
    }
    async updateStatus(id, dto, user) {
        const data = await this.agentService.updateStatus(id, dto.action, user.sub);
        return response_builder_1.ResponseBuilder.success(data, 'Status updated');
    }
    async assignKnowledgeSources(id, dto, user) {
        const data = await this.agentService.assignKnowledgeSources(id, dto, user.sub);
        return response_builder_1.ResponseBuilder.success(data, 'Knowledge sources assigned');
    }
    async configureTools(id, dto, user) {
        const data = await this.agentService.configureTools(id, dto, user.sub);
        return response_builder_1.ResponseBuilder.success(data, 'Tools updated');
    }
    async test(id, dto) {
        const data = await this.agentService.testAgent(id, dto);
        return response_builder_1.ResponseBuilder.created(data, 'Test completed');
    }
};
exports.RagAdminAgentController = RagAdminAgentController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all RAG agents (paginated)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific RAG agent' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new RAG agent' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rag_agent_types_1.CreateAgentDto, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update configuration of a RAG agent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rag_agent_types_1.UpdateAgentDto, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a RAG agent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted RAG agent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "restore", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate or deactivate a RAG agent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rag_agent_types_1.AgentStatusDto, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/knowledge-sources'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign knowledge sources to a RAG agent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rag_agent_types_1.AssignKnowledgeDto, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "assignKnowledgeSources", null);
__decorate([
    (0, common_1.Put)(':id/tools'),
    (0, swagger_1.ApiOperation)({ summary: 'Configure enabled tools for a RAG agent' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rag_agent_types_1.ConfigureToolsDto, Object]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "configureTools", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    (0, swagger_1.ApiOperation)({ summary: 'Test query an agent directly in admin context' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rag_agent_types_1.TestAgentDto]),
    __metadata("design:returntype", Promise)
], RagAdminAgentController.prototype, "test", null);
exports.RagAdminAgentController = RagAdminAgentController = __decorate([
    (0, swagger_1.ApiTags)('RAG Agent Admin'),
    (0, common_1.Controller)('admin/rag/agents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rag_agent_service_1.RagAgentService])
], RagAdminAgentController);
//# sourceMappingURL=rag-admin-agent.controller.js.map