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
exports.MeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_service_1 = require("../auth/services/jwt.service");
const customer_profile_service_1 = require("../customer-profile/customer-profile.service");
const phone_change_service_1 = require("../customer-profile/phone-change.service");
const customer_address_service_1 = require("../customer-address/customer-address.service");
const wishlist_service_1 = require("../wishlist/wishlist.service");
const cart_service_1 = require("../cart/cart.service");
const me_types_1 = require("./me.types");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const response_builder_1 = require("../../common/responses/response.builder");
const throttle_decorators_1 = require("../../common/security/throttle.decorators");
let MeController = class MeController {
    profileService;
    phoneChangeService;
    addressService;
    wishlistService;
    cartService;
    jwtService;
    constructor(profileService, phoneChangeService, addressService, wishlistService, cartService, jwtService) {
        this.profileService = profileService;
        this.phoneChangeService = phoneChangeService;
        this.addressService = addressService;
        this.wishlistService = wishlistService;
        this.cartService = cartService;
        this.jwtService = jwtService;
    }
    resolveUser(req) {
        const authHeader = req.headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const payload = this.jwtService.verify(authHeader.slice(7));
                return { userId: payload.sub };
            }
            catch {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
        }
        const guestId = req.query['guestId'] ?? undefined;
        return { guestId };
    }
    async getMe(user) {
        const [profile, wishlistCount, cart] = await Promise.all([
            this.profileService.getProfile(user.sub),
            this.wishlistService.getCount(user.sub),
            this.cartService.getCartByUser(user.sub),
        ]);
        const response = {
            ...profile,
            wishlistCount,
            cartItemCount: cart.itemCount,
            cartSubtotal: cart.subtotal,
        };
        return response_builder_1.ResponseBuilder.success(response);
    }
    async updateMe(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.profileService.updateProfile(user.sub, dto), 'Profile updated');
    }
    async requestPhoneChange(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.phoneChangeService.requestChange(user.sub, dto.phone), 'Verification code sent');
    }
    async confirmPhoneChange(user, dto) {
        return response_builder_1.ResponseBuilder.success(await this.phoneChangeService.confirmChange(user.sub, dto.phone, dto.code), 'Phone number updated');
    }
    async getAddresses(query, user) {
        return response_builder_1.ResponseBuilder.success(await this.addressService.findAll(user.sub, query));
    }
    async createAddress(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.addressService.create(dto, user.sub), 'Address created');
    }
    async updateAddress(id, dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.addressService.update(id, dto, user.sub), 'Address updated');
    }
    async deleteAddress(id, user) {
        await this.addressService.delete(id, user.sub);
        return response_builder_1.ResponseBuilder.deleted('Address deleted');
    }
    async getWishlist(query, user) {
        const [wishlist, items] = await Promise.all([
            this.wishlistService.getWishlist(user.sub),
            this.wishlistService.getItems(user.sub, query),
        ]);
        const response = {
            id: wishlist.id,
            itemCount: wishlist.itemCount,
            items: items.data,
            meta: items.meta,
        };
        return response_builder_1.ResponseBuilder.success(response);
    }
    async addToWishlist(dto, user) {
        return response_builder_1.ResponseBuilder.created(await this.wishlistService.addItem(user.sub, dto), 'Item added to wishlist');
    }
    async removeFromWishlist(productId, user) {
        await this.wishlistService.removeItem(user.sub, productId);
        return response_builder_1.ResponseBuilder.deleted('Item removed from wishlist');
    }
    async getCart(req) {
        const { userId, guestId } = this.resolveUser(req);
        return response_builder_1.ResponseBuilder.success(await this.cartService.getCart(userId, guestId));
    }
    async cartAction(req, dto) {
        const { userId, guestId } = this.resolveUser(req);
        let result;
        switch (dto.action) {
            case 'ADD':
                if (!dto.productId)
                    throw new common_1.UnauthorizedException('productId required for ADD');
                result = await this.cartService.addItem(userId, guestId, {
                    productId: dto.productId,
                    variantId: dto.variantId,
                    quantity: dto.quantity,
                });
                break;
            case 'UPDATE':
                if (!dto.itemId)
                    throw new common_1.UnauthorizedException('itemId required for UPDATE');
                result = await this.cartService.updateQuantity(userId, guestId, dto.itemId, { quantity: dto.quantity ?? 1 });
                break;
            case 'REMOVE':
                if (!dto.itemId)
                    throw new common_1.UnauthorizedException('itemId required for REMOVE');
                result = await this.cartService.removeItem(userId, guestId, dto.itemId);
                break;
            case 'SAVE_FOR_LATER':
                if (!dto.itemId)
                    throw new common_1.UnauthorizedException('itemId required for SAVE_FOR_LATER');
                result = await this.cartService.saveForLater(userId, guestId, dto.itemId);
                break;
            case 'MOVE_TO_CART':
                if (!dto.itemId)
                    throw new common_1.UnauthorizedException('itemId required for MOVE_TO_CART');
                result = await this.cartService.moveToCart(userId, guestId, dto.itemId);
                break;
            default:
                throw new common_1.UnauthorizedException('Invalid action');
        }
        return response_builder_1.ResponseBuilder.success(result, `Cart ${dto.action.toLowerCase()}`);
    }
    async clearCart(req) {
        const { userId, guestId } = this.resolveUser(req);
        await this.cartService.clearCart(userId, guestId);
        return response_builder_1.ResponseBuilder.deleted('Cart cleared');
    }
    async mergeCart(dto, user) {
        return response_builder_1.ResponseBuilder.success(await this.cartService.mergeGuestCart(user.sub, dto.guestId), 'Guest cart merged');
    }
};
exports.MeController = MeController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get my profile with wishlist count and cart summary',
    }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "getMe", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update my profile' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [me_types_1.UpdateMeDto, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "updateMe", null);
__decorate([
    (0, throttle_decorators_1.ThrottleOtpSend)(),
    (0, common_1.Post)('phone/change/request'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send a verification code to a new phone number' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, me_types_1.RequestPhoneChangeDto]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "requestPhoneChange", null);
__decorate([
    (0, throttle_decorators_1.ThrottleOtpVerify)(),
    (0, common_1.Post)('phone/change/confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm a phone number change with its code' }),
    __param(0, (0, jwt_auth_guard_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, me_types_1.ConfirmPhoneChangeDto]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "confirmPhoneChange", null);
__decorate([
    (0, common_1.Get)('addresses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List my addresses' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "getAddresses", null);
__decorate([
    (0, common_1.Post)('addresses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new address' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [me_types_1.CreateAddressDto, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "createAddress", null);
__decorate([
    (0, common_1.Put)('addresses/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update an address' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, me_types_1.UpdateAddressDto, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "updateAddress", null);
__decorate([
    (0, common_1.Delete)('addresses/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an address' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "deleteAddress", null);
__decorate([
    (0, common_1.Get)('wishlist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get my wishlist with items, count, and pagination',
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [me_types_1.WishlistQueryDto, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "getWishlist", null);
__decorate([
    (0, common_1.Post)('wishlist'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add item to wishlist' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [me_types_1.AddToWishlistDto, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "addToWishlist", null);
__decorate([
    (0, common_1.Delete)('wishlist/:productId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove item from wishlist' }),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "removeFromWishlist", null);
__decorate([
    (0, common_1.Get)('cart'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Get cart with items, summary, and counts' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "getCart", null);
__decorate([
    (0, common_1.Put)('cart'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({
        summary: 'Cart action: ADD, UPDATE, REMOVE, SAVE_FOR_LATER, MOVE_TO_CART',
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, me_types_1.CartActionDto]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "cartAction", null);
__decorate([
    (0, common_1.Delete)('cart'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiQuery)({ name: 'guestId', required: false }),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all items from cart' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "clearCart", null);
__decorate([
    (0, common_1.Post)('cart/merge'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Merge guest cart into customer cart' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, jwt_auth_guard_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [me_types_1.MergeCartDto, Object]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "mergeCart", null);
exports.MeController = MeController = __decorate([
    (0, swagger_1.ApiTags)('Me'),
    (0, common_1.Controller)('me'),
    __metadata("design:paramtypes", [customer_profile_service_1.CustomerProfileService,
        phone_change_service_1.PhoneChangeService,
        customer_address_service_1.CustomerAddressService,
        wishlist_service_1.WishlistService,
        cart_service_1.CartService,
        jwt_service_1.JwtService])
], MeController);
//# sourceMappingURL=me.controller.js.map