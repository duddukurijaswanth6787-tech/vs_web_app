import { BrandsService } from './brands.service';
import { ProductsService } from "../products/products.service";
import { ProductQueryDto } from "../products/products.types";
import { CreateBrandDto, UpdateBrandDto, BrandQueryDto } from './brands.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class BrandsController {
    private readonly brandsService;
    private readonly productsService;
    constructor(brandsService: BrandsService, productsService: ProductsService);
    findAll(query: BrandQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./brands.types").BrandResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findFeatured(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./brands.types").BrandResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findBySlug(slug: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./brands.types").BrandResponse>>;
    findProductsBySlug(slug: string, query: ProductQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("../products/products.types").ProductResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    } | {
        data: never[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>>;
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./brands.types").BrandResponse>>;
    create(dto: CreateBrandDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./brands.types").BrandResponse>>;
    update(id: string, dto: UpdateBrandDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./brands.types").BrandResponse>>;
    delete(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./brands.types").BrandResponse>>;
}
