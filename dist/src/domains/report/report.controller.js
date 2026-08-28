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
exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const report_service_1 = require("./report.service");
const report_types_1 = require("./report.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let ReportController = class ReportController {
    reportService;
    constructor(reportService) {
        this.reportService = reportService;
    }
    async getSalesReport(startDate, endDate, granularity, channel) {
        return response_builder_1.ResponseBuilder.success(await this.reportService.generateSalesReport(startDate, endDate, granularity, channel));
    }
    async getProductCategoryBreakdown() {
        return response_builder_1.ResponseBuilder.success(await this.reportService.getProductCategoryBreakdown());
    }
    async getInventoryReport() {
        return response_builder_1.ResponseBuilder.success(await this.reportService.generateInventoryReport());
    }
    async getInventoryMovementSeries(startDate, endDate, granularity) {
        return response_builder_1.ResponseBuilder.success(await this.reportService.generateInventoryMovementSeries(startDate, endDate, granularity));
    }
    async getCustomerReport() {
        return response_builder_1.ResponseBuilder.success(await this.reportService.generateCustomerReport());
    }
    async getOrderReport(startDate, endDate, channel) {
        return response_builder_1.ResponseBuilder.success(await this.reportService.generateOrderReport(startDate, endDate, channel));
    }
    async getListReport(type, startDate, endDate, page, limit) {
        const p = page ? parseInt(page, 10) : 1;
        const l = limit ? parseInt(limit, 10) : 50;
        return response_builder_1.ResponseBuilder.success(await this.reportService.generateListReport(type.toUpperCase(), startDate, endDate, p, l));
    }
    async createExportJob(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.reportService.createExportJob(dto, user.sub), 'Export job created');
    }
    async getExportJobs(page, limit) {
        const p = page ? parseInt(page, 10) : 1;
        const l = limit ? parseInt(limit, 10) : 10;
        return response_builder_1.ResponseBuilder.success(await this.reportService.getExportJobs(p, l));
    }
    async getExportDownloadUrl(id) {
        return response_builder_1.ResponseBuilder.success(await this.reportService.getExportJobDownloadUrl(id));
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Get)('sales'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate sales report' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('granularity')),
    __param(3, (0, common_1.Query)('channel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getSalesReport", null);
__decorate([
    (0, common_1.Get)('products/category-breakdown'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get sales revenue/units broken down by product category',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getProductCategoryBreakdown", null);
__decorate([
    (0, common_1.Get)('inventory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate inventory report' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getInventoryReport", null);
__decorate([
    (0, common_1.Get)('inventory/movements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Stock in vs stock out over time' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('granularity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getInventoryMovementSeries", null);
__decorate([
    (0, common_1.Get)('customers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate customer report' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getCustomerReport", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate order report' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('channel')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getOrderReport", null);
__decorate([
    (0, common_1.Get)('list/:type'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate list report by type' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getListReport", null);
__decorate([
    (0, common_1.Post)('export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:export'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create export job' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [report_types_1.GenerateReportDto, Object]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "createExportJob", null);
__decorate([
    (0, common_1.Get)('exports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:export'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List export jobs' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getExportJobs", null);
__decorate([
    (0, common_1.Get)('exports/:id/download'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('reports:export'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get export download URL' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getExportDownloadUrl", null);
exports.ReportController = ReportController = __decorate([
    (0, swagger_1.ApiTags)('Reports'),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [report_service_1.ReportService])
], ReportController);
//# sourceMappingURL=report.controller.js.map