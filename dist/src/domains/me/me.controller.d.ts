import type { Request } from 'express';
import { JwtService } from "../auth/services/jwt.service";
import { CustomerProfileService } from "../customer-profile/customer-profile.service";
import { PhoneChangeService } from "../customer-profile/phone-change.service";
import { CustomerAddressService } from "../customer-address/customer-address.service";
import { WishlistService } from "../wishlist/wishlist.service";
import { CartService } from "../cart/cart.service";
import { UpdateMeDto, RequestPhoneChangeDto, ConfirmPhoneChangeDto, CreateAddressDto, UpdateAddressDto, AddToWishlistDto, WishlistQueryDto, WishlistResponse, CartActionDto, MergeCartDto, MeResponse } from './me.types';
import type { CartResponse } from "../cart/cart.types";
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class MeController {
    private readonly profileService;
    private readonly phoneChangeService;
    private readonly addressService;
    private readonly wishlistService;
    private readonly cartService;
    private readonly jwtService;
    constructor(profileService: CustomerProfileService, phoneChangeService: PhoneChangeService, addressService: CustomerAddressService, wishlistService: WishlistService, cartService: CartService, jwtService: JwtService);
    private resolveUser;
    getMe(user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<MeResponse>>;
    updateMe(dto: UpdateMeDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("../customer-profile").ProfileResponse>>;
    requestPhoneChange(user: JwtPayload, dto: RequestPhoneChangeDto): Promise<import("@common/responses/response.builder").ResponsePayload<import("../otp/otp.types").SendOtpResponse>>;
    confirmPhoneChange(user: JwtPayload, dto: ConfirmPhoneChangeDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        phone: string;
        verified: boolean;
    }>>;
    getAddresses(query: any, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("../customer-address").AddressResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    createAddress(dto: CreateAddressDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("../customer-address").AddressResponse>>;
    updateAddress(id: string, dto: UpdateAddressDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("../customer-address").AddressResponse>>;
    deleteAddress(id: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    getWishlist(query: WishlistQueryDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<WishlistResponse>>;
    addToWishlist(dto: AddToWishlistDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("../wishlist").WishlistItemResponse>>;
    removeFromWishlist(productId: string, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    getCart(req: Request): Promise<import("@common/responses/response.builder").ResponsePayload<CartResponse>>;
    cartAction(req: Request, dto: CartActionDto): Promise<import("@common/responses/response.builder").ResponsePayload<CartResponse>>;
    clearCart(req: Request): Promise<import("@common/responses/response.builder").ResponsePayload<null>>;
    mergeCart(dto: MergeCartDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<CartResponse>>;
}
