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
exports.PackingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const packing_service_1 = require("./packing.service");
const packing_types_1 = require("./packing.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let PackingController = class PackingController {
    packingService;
    constructor(packingService) {
        this.packingService = packingService;
    }
    async queue(query) {
        return response_builder_1.ResponseBuilder.success(await this.packingService.getQueue(query));
    }
    async create(user, dto) {
        return response_builder_1.ResponseBuilder.created(await this.packingService.createJob(dto, user.sub), 'Packing job created');
    }
    async get(id) {
        return response_builder_1.ResponseBuilder.success(await this.packingService.getById(id));
    }
    async assign(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.packingService.assign(id, dto, user.sub));
    }
    async start(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.packingService.startPacking(id, user.sub));
    }
    async verify(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.packingService.verifyBarcode(id, dto, user.sub), 'Barcode verified');
    }
    async label(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.packingService.generateLabel(id, user.sub), 'Label generated');
    }
    async complete(id, user) {
        return response_builder_1.ResponseBuilder.success(await this.packingService.complete(id, user.sub), 'Packing completed');
    }
};
exports.PackingController = PackingController;
__decorate([
    (0, common_1.Get)('queue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get packing queue' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [packing_types_1.PackingQueueQueryDto]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "queue", null);
__decorate([
    (0, common_1.Post)('jobs'),
    (0, swagger_1.ApiOperation)({ summary: 'Create packing job for an order' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, packing_types_1.CreatePackingJobDto]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('jobs/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get packing job details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)('jobs/:id/assign'),
    (0, swagger_1.ApiOperation)({ summary: 'Assign packing job' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, packing_types_1.AssignPackingDto, Object]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('jobs/:id/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start packing' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('jobs/:id/verify-barcode'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify packing barcode' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, packing_types_1.VerifyBarcodeDto, Object]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('jobs/:id/label'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate packing label' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "label", null);
__decorate([
    (0, common_1.Post)('jobs/:id/complete'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark packing job completed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PackingController.prototype, "complete", null);
exports.PackingController = PackingController = __decorate([
    (0, swagger_1.ApiTags)('Packing'),
    (0, common_1.Controller)('packing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin', 'staff'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [packing_service_1.PackingService])
], PackingController);
//# sourceMappingURL=packing.controller.js.map