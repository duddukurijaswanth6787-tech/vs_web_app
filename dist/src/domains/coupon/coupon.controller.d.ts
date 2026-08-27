import { CouponService } from './coupon.service';
import { CreateCouponDto, UpdateCouponDto, ApplyCouponDto, ValidateCouponDto, CouponQueryDto } from './coupon.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CouponController {
    private readonly couponService;
    constructor(couponService: CouponService);
    findAll(query: CouponQueryDto): Promise<import("@common/responses/response.builder").ResponsePayload<{
        data: import("./coupon.types").CouponResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findActivePublic(): Promise<import("@common/responses/response.builder").ResponsePayload<import("./coupon.types").CouponResponse[]>>;
    findById(id: string): Promise<import("@common/responses/response.builder").ResponsePayload<import("./coupon.types").CouponResponse>>;
    create(dto: CreateCouponDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./coupon.types").CouponResponse>>;
    update(id: string, dto: UpdateCouponDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./coupon.types").CouponResponse>>;
    apply(dto: ApplyCouponDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<import("./coupon.types").CouponApplyResponse>>;
    validate(dto: ValidateCouponDto, user: JwtPayload): Promise<import("@common/responses/response.builder").ResponsePayload<{
        couponId: string;
        code: string;
        discountAmount: number;
        freeShipping: boolean;
        message: string;
    }>>;
}
