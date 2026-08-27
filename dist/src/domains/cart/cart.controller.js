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
exports.CartController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_service_1 = require("../auth/services/jwt.service");
const cart_service_1 = require("./cart.service");
const cart_types_1 = require("./cart.types");
const response_builder_1 = require("../../common/responses/response.builder");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const common_2 = require("@nestjs/common");
let CartController = class CartController {
    cartService;
    jwtService;
    constructor(cartService, jwtService) {
        this.cartService = cartService;
        this.jwtService = jwtService;
    }
    resolveUser(req) {
        const authHeader = req.headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7).trim();
            if (token && token !== 'null' && token !== 'undefined') {
                try {
                    const payload = this.jwtService.verify(token);
                    if (payload?.sub) {
                        return { userId: payload.sub };
                    }
                }
                catch {
                }
            }
        }
        const rawGuestId = req.query['guestId'];
        const guestId = typeof rawGuestId === 'string' && rawGuestId.trim() ? rawGuestId.trim() : undefined;
        return { guestId };
    }
    async getCart(req) {
        const { userId, guestId } = this.resolveUser(req);
        return response_builder_1.ResponseBuilder.success(await this.cartService.getCart(userId, guestId));
    }
    async getCartSummary(req) {
        const { userId, guestId } = this.resolveUser(req);
        return response_builder_1.ResponseBuilder.success(await this.cartService.getCartSummary(userId, guestId));
    }
    async addItem(req, dto) {
        const authHeader = req.headers['authorization'];
        let userId;
        let guestId;
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const payload = this.jwtService.verify(authHeader.slice(7));
                userId = payload.sub;
            }
            catch {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
        }
        else {
            guestId = req.query['guestId'] ?? req.body?.guestId;
        }
        return response_builder_1.ResponseBuilder.success(await this.cartService.addItem(userId, guestId, dto), 'Item added to cart');
    }
    async updateQuantity(req, itemId, dto) {
        const { userId, guestId } = this.resolveUser(req);
        return response_builder_1.ResponseBuilder.success(await this.cartService.updateQuantity(userId, guestId, itemId, dto), 'Cart updated');
    }
    async removeItem(req, itemId) {
        const { userId, guestId } = this.resolveUser(req);
        return response_builder_1.ResponseBuilder.success(await this.cartService.removeItem(userId, guestId, itemId), 'Item removed');
    }
    async clearCart(req) {
        const { userId, guestId } = this.resolveUser(req);
        await this.cartService.clearCart(userId, guestId);
        return response_builder_1.ResponseBuilder.deleted('Cart cleared');
    }
    async saveForLater(req, itemId) {
        const { userId, guestId } = this.resolveUser(req);
        return response_builder_1.ResponseBuilder.success(await this.cartService.saveForLater(userId, guestId, itemId), 'Item saved for later');
    }
    async moveToCart(req, itemId) {
        const { userId, guestId } = this.resolveUser(req);
        return response_builder_1.ResponseBuilder.success(await this.cartService.moveToCart(userId, guestId, itemId), 'Item moved to cart');
    }
    async mergeCart(req, dto) {
        const authHeader = req.headers['authorization'];
        if (!authHeader?.startsWith('Bearer '))
            throw new common_1.UnauthorizedException('Authentication required for cart merge');
        let userId;
        try {
            const payload = this.jwtService.verify(authHeader.slice(7));
            userId = payload.sub;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        return response_builder_1.ResponseBuilder.success(await this.cartService.mergeGuestCart(userId, dto.guestId), 'Guest cart merged');
    }
    async getCartAdmin(customerId) {
        return response_builder_1.ResponseBuilder.success(await this.cartService.getCartByCustomerIdAdmin(customerId));
    }
};
exports.CartController = CartController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Get cart (works for both guest and customer)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCart", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Get cart summary' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCartSummary", null);
__decorate([
    (0, common_1.Post)('items'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add item to cart' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_types_1.AddToCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "addItem", null);
__decorate([
    (0, common_1.Patch)('items/:itemId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Update item quantity' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, cart_types_1.UpdateQuantityDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "updateQuantity", null);
__decorate([
    (0, common_1.Delete)('items/:itemId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Remove item from cart' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "removeItem", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all items from cart' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "clearCart", null);
__decorate([
    (0, common_1.Post)('items/:itemId/save-for-later'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Save item for later' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "saveForLater", null);
__decorate([
    (0, common_1.Post)('items/:itemId/move-to-cart'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Move saved item back to cart' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "moveToCart", null);
__decorate([
    (0, common_1.Post)('merge'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Merge guest cart into customer cart' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, cart_types_1.MergeCartDto]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "mergeCart", null);
__decorate([
    (0, common_1.Get)('admin/customer/:customerId'),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)('super_admin', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get active cart of any customer (Admin only)' }),
    __param(0, (0, common_1.Param)('customerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CartController.prototype, "getCartAdmin", null);
exports.CartController = CartController = __decorate([
    (0, swagger_1.ApiTags)('Shopping Cart'),
    (0, common_1.Controller)('cart'),
    __metadata("design:paramtypes", [cart_service_1.CartService,
        jwt_service_1.JwtService])
], CartController);
//# sourceMappingURL=cart.controller.js.map