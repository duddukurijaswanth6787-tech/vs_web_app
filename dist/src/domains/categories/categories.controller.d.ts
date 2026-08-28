import { CategoriesService } from './categories.service';
import { ProductsService } from "../products/products.service";
import { ProductQueryDto } from "../products/products.types";
import { CreateCategoryDto, UpdateCategoryDto, MoveCategoryDto, ReorderCategoriesDto, CategoryQueryDto } from './categories.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class CategoriesController {
    private readonly categoriesService;
    private readonly productsService;
    constructor(categoriesService: CategoriesService, productsService: ProductsService);
    findAll(query: CategoryQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./categories.types").CategoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getTree(): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryTreeNode[]>>;
    findFeatured(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./categories.types").CategoryResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findBySlug(slug: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse>>;
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
    findById(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse>>;
    findChildren(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse[]>>;
    findAncestors(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse[]>>;
    create(dto: CreateCategoryDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse>>;
    update(id: string, dto: UpdateCategoryDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse>>;
    move(id: string, dto: MoveCategoryDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse>>;
    reorder(dto: ReorderCategoriesDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    delete(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./categories.types").CategoryResponse>>;
}
