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
exports.GiftCardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gift_card_service_1 = require("./gift-card.service");
const gift_card_types_1 = require("./gift-card.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let GiftCardController = class GiftCardController {
    giftCardService;
    constructor(giftCardService) {
        this.giftCardService = giftCardService;
    }
    async purchase(user, dto) {
        return response_builder_1.ResponseBuilder.created(await this.giftCardService.purchase(user.sub, dto), 'Gift card purchased');
    }
    async redeem(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.giftCardService.redeem(user.sub, dto), 'Gift card redeemed');
    }
    async balance(dto) {
        return response_builder_1.ResponseBuilder.success(await this.giftCardService.getBalance(dto.code));
    }
    async create(user, dto) {
        return response_builder_1.ResponseBuilder.created(await this.giftCardService.createAdmin(dto, user.sub), 'Gift card created');
    }
    async list(page, limit) {
        return response_builder_1.ResponseBuilder.success(await this.giftCardService.listAdmin(Number(page) || 1, Number(limit) || 20));
    }
};
exports.GiftCardController = GiftCardController;
__decorate([
    (0, common_1.Post)('purchase'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase a gift card' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, gift_card_types_1.PurchaseGiftCardDto]),
    __metadata("design:returntype", Promise)
], GiftCardController.prototype, "purchase", null);
__decorate([
    (0, common_1.Post)('redeem'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Redeem gift card balance' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, gift_card_types_1.RedeemGiftCardDto]),
    __metadata("design:returntype", Promise)
], GiftCardController.prototype, "redeem", null);
__decorate([
    (0, common_1.Post)('balance'),
    (0, swagger_1.ApiOperation)({ summary: 'Check gift card balance by code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [gift_card_types_1.GiftCardBalanceDto]),
    __metadata("design:returntype", Promise)
], GiftCardController.prototype, "balance", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: create gift card' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, gift_card_types_1.CreateGiftCardDto]),
    __metadata("design:returntype", Promise)
], GiftCardController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list gift cards' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GiftCardController.prototype, "list", null);
exports.GiftCardController = GiftCardController = __decorate([
    (0, swagger_1.ApiTags)('Gift Cards'),
    (0, common_1.Controller)('gift-cards'),
    __metadata("design:paramtypes", [gift_card_service_1.GiftCardService])
], GiftCardController);
//# sourceMappingURL=gift-card.controller.js.map