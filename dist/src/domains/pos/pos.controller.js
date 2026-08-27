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
exports.PosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const pos_service_1 = require("./pos.service");
const pos_types_1 = require("./pos.types");
let PosController = class PosController {
    posService;
    constructor(posService) {
        this.posService = posService;
    }
    async scanBarcode(user, dto) {
        const isOwnerOrManager = (user.roles || []).some((r) => ['super_admin', 'admin'].includes(r));
        return this.posService.scanBarcode(dto, isOwnerOrManager);
    }
    async createCheckoutSession(user, dto) {
        return this.posService.createCheckoutSession(user.sub, dto);
    }
    async adoptHandoffSession(dto) {
        return this.posService.adoptHandoffSession(dto);
    }
    async completeSale(user, dto) {
        return this.posService.completeSale(user.sub, dto);
    }
    async generateBarcodeImage(query, res) {
        const buffer = await this.posService.generateBarcodeImage(query);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(buffer);
    }
    async generateBatchStickers(dto) {
        return this.posService.generateBatchStickers(dto);
    }
    async previewReceipt(dto) {
        return this.posService.previewReceipt(dto);
    }
    async lookupCustomer(phone) {
        return this.posService.lookupCustomer(phone || '');
    }
    async lookupSaleForReturn(orderNumber) {
        return this.posService.lookupSaleForReturn(orderNumber || '');
    }
    async createReturn(user, dto) {
        return this.posService.createReturn(user.sub, dto);
    }
    async openShift(user, dto) {
        return this.posService.openShift(user.sub, dto);
    }
    async getCurrentShift(user, terminalId) {
        return this.posService.getCurrentShift(user.sub, terminalId);
    }
    async closeShift(user, id, dto) {
        return this.posService.closeShift(id, user.sub, dto);
    }
    async listShifts(page, limit, status, terminalId, cashierId) {
        return this.posService.listShifts({
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
            status,
            terminalId,
            cashierId,
        });
    }
    async getShiftReport(id) {
        return this.posService.getShiftReport(id);
    }
    async getPosAnalyticsSummary(date) {
        return this.posService.getPosDaySummary(date);
    }
};
exports.PosController = PosController;
__decorate([
    (0, common_1.Post)('scan'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Scan Barcode or SKU for Instant Product Lookup' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: pos_types_1.BarcodeScanResultResponse }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pos_types_1.ScanBarcodeDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "scanBarcode", null);
__decorate([
    (0, common_1.Post)('checkout-sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create Mobile-to-Desktop Checkout Handoff Session',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, type: pos_types_1.CheckoutSessionResponse }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pos_types_1.CreateCheckoutSessionDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "createCheckoutSession", null);
__decorate([
    (0, common_1.Post)('checkout-sessions/adopt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Adopt Handoff Token on Desktop Web POS' }),
    (0, swagger_1.ApiResponse)({ status: 200, type: pos_types_1.CheckoutSessionResponse }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_types_1.AdoptHandoffTokenDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "adoptHandoffSession", null);
__decorate([
    (0, common_1.Post)('sales/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Complete POS Sale & Trigger Invoice Printing' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pos_types_1.CompletePosSaleDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "completeSale", null);
__decorate([
    (0, common_1.Get)('barcodes/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate Code128 / EAN / QR Barcode PNG Image Stream',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_types_1.GenerateBarcodeImageDto, Object]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "generateBarcodeImage", null);
__decorate([
    (0, common_1.Post)('barcodes/batch-stickers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate N Copies of Barcode Sticker Labels (HTML & TSPL)',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_types_1.GenerateBatchStickersDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "generateBatchStickers", null);
__decorate([
    (0, common_1.Post)('printers/preview-receipt'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Preview Invoice Thermal Receipt (HTML & ESC/POS Base64)',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pos_types_1.PreviewReceiptDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "previewReceipt", null);
__decorate([
    (0, common_1.Get)('customers/lookup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Lookup Customer details & Order History by Phone Number',
    }),
    __param(0, (0, common_1.Query)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "lookupCustomer", null);
__decorate([
    (0, common_1.Get)('returns/lookup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Look up an in-store sale and what is still returnable on it',
    }),
    __param(0, (0, common_1.Query)('orderNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "lookupSaleForReturn", null);
__decorate([
    (0, common_1.Post)('returns'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Take goods back at the counter: restock, refund, and record it',
    }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pos_types_1.CreatePosReturnDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "createReturn", null);
__decorate([
    (0, common_1.Post)('shifts/open'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Open a new till/shift with a starting cash float' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pos_types_1.OpenPosShiftDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "openShift", null);
__decorate([
    (0, common_1.Get)('shifts/current'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get the current logged-in cashier's open shift" }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('terminalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getCurrentShift", null);
__decorate([
    (0, common_1.Post)('shifts/:id/close'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Close a shift: count cash, compute variance' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pos_types_1.ClosePosShiftDto]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "closeShift", null);
__decorate([
    (0, common_1.Get)('shifts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'List shifts (till reconciliation history) -- Till & Shift Dashboard access, gated by the pos:view permission',
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('terminalId')),
    __param(4, (0, common_1.Query)('cashierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "listShifts", null);
__decorate([
    (0, common_1.Get)('shifts/:id/report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get the X-Report (open shift) or Z-Report (closed shift) for a shift -- Till & Shift Dashboard access, gated by the pos:view permission',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getShiftReport", null);
__decorate([
    (0, common_1.Get)('analytics/summary'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_guard_1.Permissions)('pos:view'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Day-level POS summary: payment split, terminal & cashier performance, returns -- Till & Shift Dashboard access, gated by the pos:view permission',
    }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PosController.prototype, "getPosAnalyticsSummary", null);
exports.PosController = PosController = __decorate([
    (0, swagger_1.ApiTags)('POS (Point of Sale & Shopora)'),
    (0, common_1.Controller)('pos'),
    __metadata("design:paramtypes", [pos_service_1.PosService])
], PosController);
//# sourceMappingURL=pos.controller.js.map