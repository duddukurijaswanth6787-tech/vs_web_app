import type { Request } from 'express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, AssignCategoriesDto, AssignAttributesDto, AssignTagsDto, AssignCollectionsDto, AssignRelatedProductsDto } from './products.types';
import { CreateColorGroupDto, SyncColorGroupsDto } from './dto/color-group.dto';
import { AuthService } from "../auth/auth.service";
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class ProductsController {
    private readonly productsService;
    private readonly authService;
    constructor(productsService: ProductsService, authService: AuthService);
    private isInternalRequest;
    findAll(query: ProductQueryDto, req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./products.types").ProductResponse[];
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
    findById(id: string, req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    create(dto: CreateProductDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    update(id: string, dto: UpdateProductDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    delete(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    restore(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    publish(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    unpublish(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    feature(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    unfeature(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    assignCategories(id: string, dto: AssignCategoriesDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    removeCategory(id: string, categoryId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    assignAttributes(id: string, dto: AssignAttributesDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    removeAttribute(id: string, attributeId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    assignTags(id: string, dto: AssignTagsDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    removeTag(id: string, tag: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    assignCollections(id: string, dto: AssignCollectionsDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    removeCollection(id: string, collection: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    assignRelatedProducts(id: string, dto: AssignRelatedProductsDto): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    removeRelatedProduct(id: string, relatedProductId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./products.types").ProductResponse>>;
    createColorGroup(id: string, dto: CreateColorGroupDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        media: {
            url: string;
            id: string;
            displayOrder: number;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            mediaType: string;
            title: string | null;
            altText: string | null;
            thumbnailUrl: string | null;
            isPrimary: boolean;
            color: string | null;
            variantId: string | null;
            colorGroupId: string | null;
        }[];
        variants: {
            length: import("@prisma/client-runtime-utils").Decimal | null;
            id: string;
            displayOrder: number;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            isDefault: boolean;
            sku: string;
            barcode: string;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            weight: import("@prisma/client-runtime-utils").Decimal | null;
            width: import("@prisma/client-runtime-utils").Decimal | null;
            height: import("@prisma/client-runtime-utils").Decimal | null;
            productId: string;
            title: string;
            colorGroupId: string | null;
            priceOverride: import("@prisma/client-runtime-utils").Decimal | null;
            salePriceOverride: import("@prisma/client-runtime-utils").Decimal | null;
            isActive: boolean;
        }[];
        colorAttributeOption: {
            id: string;
            value: string;
            label: string;
            swatchImageUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        isActive: boolean;
        label: string | null;
        colorAttributeOptionId: string;
        sortOrder: number;
    }>>;
    getColorGroups(id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<({
        media: {
            url: string;
            id: string;
            displayOrder: number;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            mediaType: string;
            title: string | null;
            altText: string | null;
            thumbnailUrl: string | null;
            isPrimary: boolean;
            color: string | null;
            variantId: string | null;
            colorGroupId: string | null;
        }[];
        variants: ({
            attributeValues: ({
                attribute: {
                    id: string;
                    slug: string;
                    name: string;
                };
                option: {
                    id: string;
                    value: string;
                    label: string;
                    swatchImageUrl: string | null;
                } | null;
            } & {
                id: string;
                variantId: string;
                value: string | null;
                attributeId: string;
                attributeOptionId: string | null;
            })[];
        } & {
            length: import("@prisma/client-runtime-utils").Decimal | null;
            id: string;
            displayOrder: number;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            isDefault: boolean;
            sku: string;
            barcode: string;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            weight: import("@prisma/client-runtime-utils").Decimal | null;
            width: import("@prisma/client-runtime-utils").Decimal | null;
            height: import("@prisma/client-runtime-utils").Decimal | null;
            productId: string;
            title: string;
            colorGroupId: string | null;
            priceOverride: import("@prisma/client-runtime-utils").Decimal | null;
            salePriceOverride: import("@prisma/client-runtime-utils").Decimal | null;
            isActive: boolean;
        })[];
        colorAttributeOption: {
            id: string;
            value: string;
            label: string;
            swatchImageUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        isActive: boolean;
        label: string | null;
        colorAttributeOptionId: string;
        sortOrder: number;
    })[]>>;
    deleteColorGroup(id: string, groupId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    syncColorGroups(id: string, dto: SyncColorGroupsDto): Promise<import("../../common/responses/response.builder").ResponsePayload<({
        media: {
            url: string;
            id: string;
            displayOrder: number;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            productId: string;
            mediaType: string;
            title: string | null;
            altText: string | null;
            thumbnailUrl: string | null;
            isPrimary: boolean;
            color: string | null;
            variantId: string | null;
            colorGroupId: string | null;
        }[];
        variants: ({
            attributeValues: ({
                attribute: {
                    id: string;
                    slug: string;
                    name: string;
                };
                option: {
                    id: string;
                    value: string;
                    label: string;
                    swatchImageUrl: string | null;
                } | null;
            } & {
                id: string;
                variantId: string;
                value: string | null;
                attributeId: string;
                attributeOptionId: string | null;
            })[];
        } & {
            length: import("@prisma/client-runtime-utils").Decimal | null;
            id: string;
            displayOrder: number;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            isDefault: boolean;
            sku: string;
            barcode: string;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            weight: import("@prisma/client-runtime-utils").Decimal | null;
            width: import("@prisma/client-runtime-utils").Decimal | null;
            height: import("@prisma/client-runtime-utils").Decimal | null;
            productId: string;
            title: string;
            colorGroupId: string | null;
            priceOverride: import("@prisma/client-runtime-utils").Decimal | null;
            salePriceOverride: import("@prisma/client-runtime-utils").Decimal | null;
            isActive: boolean;
        })[];
        colorAttributeOption: {
            id: string;
            value: string;
            label: string;
            swatchImageUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        productId: string;
        isActive: boolean;
        label: string | null;
        colorAttributeOptionId: string;
        sortOrder: number;
    })[]>>;
}
