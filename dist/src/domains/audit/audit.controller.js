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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const audit_service_1 = require("./audit.service");
const audit_types_1 = require("./audit.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let AuditController = class AuditController {
    auditService;
    constructor(auditService) {
        this.auditService = auditService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.auditService.findAll(query));
    }
    async getStats() {
        return response_builder_1.ResponseBuilder.success(await this.auditService.getStats());
    }
    async getEntityHistory(resource, resourceId) {
        return response_builder_1.ResponseBuilder.success(await this.auditService.getEntityHistory(resource, resourceId));
    }
    async compareVersions(id) {
        return response_builder_1.ResponseBuilder.success(await this.auditService.compareVersions(id));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.auditService.findById(id));
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List audit logs with search, filter, pagination, date range',
    }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [audit_types_1.AuditLogQueryDto]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('entity/:resource/:resourceId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit history for a specific entity' }),
    __param(0, (0, common_1.Param)('resource')),
    __param(1, (0, common_1.Param)('resourceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getEntityHistory", null);
__decorate([
    (0, common_1.Get)('compare/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Compare old and new values in an audit log' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "compareVersions", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit log by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "findById", null);
exports.AuditController = AuditController = __decorate([
    (0, swagger_1.ApiTags)('Audit Logs'),
    (0, common_1.Controller)('audit-logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map