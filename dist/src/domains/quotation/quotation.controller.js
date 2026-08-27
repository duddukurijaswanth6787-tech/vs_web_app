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
exports.QuotationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const quotation_service_1 = require("./quotation.service");
const quotation_types_1 = require("./quotation.types");
let QuotationController = class QuotationController {
    quotationService;
    constructor(quotationService) {
        this.quotationService = quotationService;
    }
    async list(status, search, page, limit) {
        return response_builder_1.ResponseBuilder.success(await this.quotationService.list({
            status,
            search,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        }));
    }
    async get(id) {
        return response_builder_1.ResponseBuilder.success(await this.quotationService.get(id));
    }
    async create(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.quotationService.create(user.sub, dto));
    }
    async update(user, id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.quotationService.update(user.sub, id, dto));
    }
    async cancel(user, id) {
        return response_builder_1.ResponseBuilder.success(await this.quotationService.cancel(user.sub, id));
    }
    async convert(user, id, dto) {
        return response_builder_1.ResponseBuilder.success(await this.quotationService.convert(user.sub, id, dto));
    }
};
exports.QuotationController = QuotationController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_guard_1.Permissions)('quotations:view'),
    (0, swagger_1.ApiOperation)({ summary: 'List quotations' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_guard_1.Permissions)('quotations:view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get one quotation' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_guard_1.Permissions)('quotations:create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a quotation' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, quotation_types_1.CreateQuotationDto]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_guard_1.Permissions)('quotations:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Update a draft quotation' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quotation_types_1.UpdateQuotationDto]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/cancel'),
    (0, permissions_guard_1.Permissions)('quotations:update'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a quotation' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(':id/convert'),
    (0, permissions_guard_1.Permissions)('quotations:convert'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert an accepted quotation into a POS sale' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, quotation_types_1.ConvertQuotationDto]),
    __metadata("design:returntype", Promise)
], QuotationController.prototype, "convert", null);
exports.QuotationController = QuotationController = __decorate([
    (0, swagger_1.ApiTags)('Quotations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('quotations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [quotation_service_1.QuotationService])
], QuotationController);
//# sourceMappingURL=quotation.controller.js.map