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
exports.RecentlyViewedController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const recently_viewed_service_1 = require("./recently-viewed.service");
const recently_viewed_types_1 = require("./recently-viewed.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let RecentlyViewedController = class RecentlyViewedController {
    recentlyViewedService;
    constructor(recentlyViewedService) {
        this.recentlyViewedService = recentlyViewedService;
    }
    async track(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.recentlyViewedService.track(user.sub, dto));
    }
    async list(user, query) {
        return response_builder_1.ResponseBuilder.success(await this.recentlyViewedService.list(user.sub, query));
    }
    async clear(user) {
        return response_builder_1.ResponseBuilder.success(await this.recentlyViewedService.clear(user.sub), 'Cleared');
    }
};
exports.RecentlyViewedController = RecentlyViewedController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Track a product view' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, recently_viewed_types_1.TrackViewDto]),
    __metadata("design:returntype", Promise)
], RecentlyViewedController.prototype, "track", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List recently viewed products' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, recently_viewed_types_1.RecentlyViewedQueryDto]),
    __metadata("design:returntype", Promise)
], RecentlyViewedController.prototype, "list", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Clear recently viewed history' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RecentlyViewedController.prototype, "clear", null);
exports.RecentlyViewedController = RecentlyViewedController = __decorate([
    (0, swagger_1.ApiTags)('Recently Viewed'),
    (0, common_1.Controller)('recently-viewed'),
    __metadata("design:paramtypes", [recently_viewed_service_1.RecentlyViewedService])
], RecentlyViewedController);
//# sourceMappingURL=recently-viewed.controller.js.map