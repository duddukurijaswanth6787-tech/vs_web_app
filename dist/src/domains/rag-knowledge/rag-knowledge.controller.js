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
exports.RagKnowledgeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const rag_knowledge_service_1 = require("./rag-knowledge.service");
const rag_knowledge_types_1 = require("./rag-knowledge.types");
let RagKnowledgeController = class RagKnowledgeController {
    knowledgeService;
    constructor(knowledgeService) {
        this.knowledgeService = knowledgeService;
    }
    async findAll(page = 1, limit = 10) {
        const data = await this.knowledgeService.findAll(Number(page), Number(limit));
        return response_builder_1.ResponseBuilder.success(data);
    }
    async findById(id) {
        const data = await this.knowledgeService.findById(id);
        return response_builder_1.ResponseBuilder.success(data);
    }
    async create(dto, user) {
        const data = await this.knowledgeService.create(dto, user.sub);
        return response_builder_1.ResponseBuilder.created(data, 'Knowledge source created');
    }
    async update(id, dto, user) {
        const data = await this.knowledgeService.update(id, dto, user.sub);
        return response_builder_1.ResponseBuilder.success(data, 'Knowledge source updated');
    }
    async delete(id, user) {
        await this.knowledgeService.softDelete(id, user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Knowledge source deleted');
    }
    async restore(id, user) {
        await this.knowledgeService.restore(id, user.sub);
        return response_builder_1.ResponseBuilder.success(null, 'Knowledge source restored');
    }
    async getUploadUrl(dto) {
        const data = await this.knowledgeService.getUploadUrl(dto);
        return response_builder_1.ResponseBuilder.created(data, 'Upload URL generated');
    }
    async confirmUpload(id, dto, user) {
        const data = await this.knowledgeService.confirmUpload(id, dto.s3Key, dto.fileName, dto.mimeType, dto.size, user.sub);
        return response_builder_1.ResponseBuilder.created(data, 'Upload confirmed');
    }
    async reindex(id, user) {
        const data = await this.knowledgeService.reindex(id, user.sub);
        return response_builder_1.ResponseBuilder.success(data, 'Reindexing triggered');
    }
    async getStatus(id) {
        const data = await this.knowledgeService.findById(id);
        return response_builder_1.ResponseBuilder.success({
            id: data.id,
            status: data.status,
            lastIndexedAt: data.lastIndexedAt,
            indexingError: data.indexingError,
        });
    }
    async findChunks(id, page = 1, limit = 20) {
        const data = await this.knowledgeService.findChunks(id, Number(page), Number(limit));
        return response_builder_1.ResponseBuilder.success(data);
    }
};
exports.RagKnowledgeController = RagKnowledgeController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all knowledge sources' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get details of a specific knowledge source' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new knowledge source' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rag_knowledge_types_1.CreateKnowledgeSourceDto, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a knowledge source' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, rag_knowledge_types_1.UpdateKnowledgeSourceDto, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete a knowledge source' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a soft-deleted knowledge source' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)('upload-url'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate S3 presigned upload URL for a document' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [rag_knowledge_types_1.UploadUrlRequestDto]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "getUploadUrl", null);
__decorate([
    (0, common_1.Post)(':id/confirm-upload'),
    (0, swagger_1.ApiOperation)({
        summary: 'Confirm document upload exists in S3 and trigger indexing',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "confirmUpload", null);
__decorate([
    (0, common_1.Post)(':id/reindex'),
    (0, swagger_1.ApiOperation)({ summary: 'Trigger manual re-indexing for a source' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "reindex", null);
__decorate([
    (0, common_1.Get)(':id/indexing-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current indexing status of a source' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)(':id/chunks'),
    (0, swagger_1.ApiOperation)({
        summary: 'List all text chunks inside a specific knowledge source',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RagKnowledgeController.prototype, "findChunks", null);
exports.RagKnowledgeController = RagKnowledgeController = __decorate([
    (0, swagger_1.ApiTags)('RAG Knowledge Admin'),
    (0, common_1.Controller)('admin/rag/knowledge-sources'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('admin', 'super_admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [rag_knowledge_service_1.RagKnowledgeService])
], RagKnowledgeController);
//# sourceMappingURL=rag-knowledge.controller.js.map