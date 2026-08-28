import { PrismaService } from "../../database/prisma.service";
import { TrackViewDto, RecentlyViewedQueryDto } from './recently-viewed.types';
export declare class RecentlyViewedService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getProfile;
    track(userId: string, dto: TrackViewDto): Promise<{
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
    }>;
    list(userId: string, query: RecentlyViewedQueryDto): Promise<{
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
    }>;
    clear(userId: string): Promise<{
        cleared: boolean;
    }>;
}
