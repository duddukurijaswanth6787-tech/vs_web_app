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
exports.DtdcController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const dtdc_service_1 = require("./dtdc.service");
const dtdc_types_1 = require("./dtdc.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let DtdcController = class DtdcController {
    dtdcService;
    constructor(dtdcService) {
        this.dtdcService = dtdcService;
    }
    async create(user, dto) {
        return response_builder_1.ResponseBuilder.created(await this.dtdcService.createShipment(dto, user.sub), 'Shipment created');
    }
    async byOrder(orderId) {
        return response_builder_1.ResponseBuilder.success(await this.dtdcService.listByOrder(orderId));
    }
    async track(awbOrId) {
        return response_builder_1.ResponseBuilder.success(await this.dtdcService.track(awbOrId));
    }
    async label(awbOrId) {
        return response_builder_1.ResponseBuilder.success(await this.dtdcService.getLabel(awbOrId));
    }
    async cancel(awbOrId, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.dtdcService.cancel(awbOrId, dto, user.sub), 'Shipment cancelled');
    }
};
exports.DtdcController = DtdcController;
__decorate([
    (0, common_1.Post)('shipments'),
    (0, swagger_1.ApiOperation)({ summary: 'Create DTDC shipment for order' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtdc_types_1.CreateDtdcShipmentDto]),
    __metadata("design:returntype", Promise)
], DtdcController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('shipments/order/:orderId'),
    (0, swagger_1.ApiOperation)({ summary: 'List DTDC shipments for order' }),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DtdcController.prototype, "byOrder", null);
__decorate([
    (0, common_1.Get)('shipments/:awbOrId/track'),
    (0, swagger_1.ApiOperation)({ summary: 'Track DTDC shipment' }),
    __param(0, (0, common_1.Param)('awbOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DtdcController.prototype, "track", null);
__decorate([
    (0, common_1.Get)('shipments/:awbOrId/label'),
    (0, swagger_1.ApiOperation)({ summary: 'Get DTDC shipping label URL' }),
    __param(0, (0, common_1.Param)('awbOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DtdcController.prototype, "label", null);
__decorate([
    (0, common_1.Post)('shipments/:awbOrId/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel DTDC shipment' }),
    __param(0, (0, common_1.Param)('awbOrId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dtdc_types_1.CancelDtdcShipmentDto, Object]),
    __metadata("design:returntype", Promise)
], DtdcController.prototype, "cancel", null);
exports.DtdcController = DtdcController = __decorate([
    (0, swagger_1.ApiTags)('DTDC Shipping'),
    (0, common_1.Controller)('shipping/dtdc'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin', 'staff'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [dtdc_service_1.DtdcService])
], DtdcController);
//# sourceMappingURL=dtdc.controller.js.map