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
exports.TaxController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tax_service_1 = require("./tax.service");
const tax_types_1 = require("./tax.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let TaxController = class TaxController {
    taxService;
    constructor(taxService) {
        this.taxService = taxService;
    }
    async findAll(query) {
        return response_builder_1.ResponseBuilder.success(await this.taxService.findAll(query));
    }
    async findById(id) {
        return response_builder_1.ResponseBuilder.success(await this.taxService.findById(id));
    }
    async create(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.taxService.create(user.sub, dto), 'Tax rule created');
    }
    async update(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.taxService.update(id, user.sub, dto), 'Tax rule updated');
    }
    async calculateTax(dto) {
        return response_builder_1.ResponseBuilder.success(await this.taxService.calculateTax(dto));
    }
};
exports.TaxController = TaxController;
__decorate([
    (0, common_1.Get)('rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List tax rules' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TaxController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('rules/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get tax rule by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TaxController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)('rules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create tax rule' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_types_1.CreateTaxRuleDto, Object]),
    __metadata("design:returntype", Promise)
], TaxController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('rules/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update tax rule' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, tax_types_1.UpdateTaxRuleDto, Object]),
    __metadata("design:returntype", Promise)
], TaxController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('calculate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate tax' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tax_types_1.CalculateTaxDto]),
    __metadata("design:returntype", Promise)
], TaxController.prototype, "calculateTax", null);
exports.TaxController = TaxController = __decorate([
    (0, swagger_1.ApiTags)('Tax'),
    (0, common_1.Controller)('tax'),
    __metadata("design:paramtypes", [tax_service_1.TaxService])
], TaxController);
//# sourceMappingURL=tax.controller.js.map