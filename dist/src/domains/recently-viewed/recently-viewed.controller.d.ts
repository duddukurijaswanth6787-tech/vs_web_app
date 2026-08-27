import { RecentlyViewedService } from './recently-viewed.service';
import { TrackViewDto, RecentlyViewedQueryDto } from './recently-viewed.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class RecentlyViewedController {
    private readonly recentlyViewedService;
    constructor(recentlyViewedService: RecentlyViewedService);
    track(user: JwtPayload, dto: TrackViewDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        product: {
            id: string;
            slug: string;
            name: string;
            basePrice: import("@prisma/client-runtime-utils").Decimal;
            salePrice: import("@prisma/client-runtime-utils").Decimal | null;
        };
    } & {
        id: string;
        productId: string;
        customerId: string;
        viewedAt: Date;
    }>>;
    list(user: JwtPayload, query: RecentlyViewedQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: ({
            product: {
                id: string;
                slug: string;
                name: string;
                status: string;
                basePrice: import("@prisma/client-runtime-utils").Decimal;
                salePrice: import("@prisma/client-runtime-utils").Decimal | null;
            };
        } & {
            id: string;
            productId: string;
            customerId: string;
            viewedAt: Date;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>>;
    clear(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        cleared: boolean;
    }>>;
}
