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
exports.CheckoutController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const checkout_service_1 = require("./checkout.service");
const checkout_types_1 = require("./checkout.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
let CheckoutController = class CheckoutController {
    checkoutService;
    constructor(checkoutService) {
        this.checkoutService = checkoutService;
    }
    async preview(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.checkoutService.preview(user.sub, dto));
    }
    async placeOrder(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.checkoutService.placeOrder(user.sub, dto), 'Order placed');
    }
};
exports.CheckoutController = CheckoutController;
__decorate([
    (0, common_1.Post)('preview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Preview checkout summary' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkout_types_1.CheckoutPreviewDto, Object]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)('place-order'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Place order' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [checkout_types_1.PlaceOrderDto, Object]),
    __metadata("design:returntype", Promise)
], CheckoutController.prototype, "placeOrder", null);
exports.CheckoutController = CheckoutController = __decorate([
    (0, swagger_1.ApiTags)('Checkout'),
    (0, common_1.Controller)('checkout'),
    __metadata("design:paramtypes", [checkout_service_1.CheckoutService])
], CheckoutController);
//# sourceMappingURL=checkout.controller.js.map