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
exports.AiSearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_search_service_1 = require("./ai-search.service");
const ai_search_types_1 = require("./ai-search.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AiSearchController = class AiSearchController {
    aiSearchService;
    constructor(aiSearchService) {
        this.aiSearchService = aiSearchService;
    }
    async search(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.aiSearchService.search(user.sub, dto), 'Search completed');
    }
    async getSuggestions(q) {
        return response_builder_1.ResponseBuilder.success(await this.aiSearchService.getSuggestions(q));
    }
    async getHistory(query, user) {
        return response_builder_1.ResponseBuilder.success(await this.aiSearchService.getHistory(user.sub, query.page ?? 1, query.limit ?? 20));
    }
    async getTrendingSearches() {
        return response_builder_1.ResponseBuilder.success(await this.aiSearchService.getTrendingSearches());
    }
    async getStats() {
        return response_builder_1.ResponseBuilder.success(await this.aiSearchService.getStats());
    }
};
exports.AiSearchController = AiSearchController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Perform AI search' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_search_types_1.AiSearchDto, Object]),
    __metadata("design:returntype", Promise)
], AiSearchController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get search suggestions' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiSearchController.prototype, "getSuggestions", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get search history' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_search_types_1.SearchHistoryQueryDto, Object]),
    __metadata("design:returntype", Promise)
], AiSearchController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('trending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trending searches' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiSearchController.prototype, "getTrendingSearches", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get search analytics stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiSearchController.prototype, "getStats", null);
exports.AiSearchController = AiSearchController = __decorate([
    (0, swagger_1.ApiTags)('AI Search'),
    (0, common_1.Controller)('ai/search'),
    __metadata("design:paramtypes", [ai_search_service_1.AiSearchService])
], AiSearchController);
//# sourceMappingURL=ai-search.controller.js.map