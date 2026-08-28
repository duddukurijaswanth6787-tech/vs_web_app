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
exports.ShippingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shipping_service_1 = require("./shipping.service");
const shipping_types_1 = require("./shipping.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let ShippingController = class ShippingController {
    shippingService;
    constructor(shippingService) {
        this.shippingService = shippingService;
    }
    async getMethods() {
        return response_builder_1.ResponseBuilder.success(await this.shippingService.getMethods());
    }
    async calculateShipping(code, query) {
        return response_builder_1.ResponseBuilder.success(await this.shippingService.calculateShipping({
            ...query,
            methodCode: code,
        }));
    }
    async createMethod(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.shippingService.createMethod(dto, user.sub), 'Shipping method created');
    }
    async getZones(methodId) {
        return response_builder_1.ResponseBuilder.success(await this.shippingService.getZones(methodId));
    }
    async createZone(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.shippingService.createZone(dto, user.sub), 'Shipping zone created');
    }
};
exports.ShippingController = ShippingController;
__decorate([
    (0, common_1.Get)('methods'),
    (0, swagger_1.ApiOperation)({ summary: 'List all shipping methods' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "getMethods", null);
__decorate([
    (0, common_1.Get)('methods/:code/calculate'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate shipping rate for a method' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shipping_types_1.CalculateShippingDto]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "calculateShipping", null);
__decorate([
    (0, common_1.Post)('methods'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a shipping method' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_types_1.CreateShippingMethodDto, Object]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "createMethod", null);
__decorate([
    (0, common_1.Get)('zones'),
    (0, swagger_1.ApiOperation)({ summary: 'List shipping zones for a method' }),
    __param(0, (0, common_1.Query)('methodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "getZones", null);
__decorate([
    (0, common_1.Post)('zones'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a shipping zone' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shipping_types_1.CreateShippingZoneDto, Object]),
    __metadata("design:returntype", Promise)
], ShippingController.prototype, "createZone", null);
exports.ShippingController = ShippingController = __decorate([
    (0, swagger_1.ApiTags)('Shipping'),
    (0, common_1.Controller)('shipping'),
    __metadata("design:paramtypes", [shipping_service_1.ShippingService])
], ShippingController);
//# sourceMappingURL=shipping.controller.js.map