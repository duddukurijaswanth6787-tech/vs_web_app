import { LoggerService } from "../../common/logger/logger.service";
import { AuditService } from "../audit/audit.service";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../../database/prisma.service";
import { ProductsRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, ProductResponse, AssignCategoriesDto, AssignAttributesDto, AssignTagsDto, AssignCollectionsDto, AssignRelatedProductsDto } from './products.types';
import { CreateColorGroupDto, SyncColorGroupsDto } from './dto/color-group.dto';
export declare class ProductsService {
    private readonly prisma;
    private readonly productsRepository;
    private readonly auditService;
    private readonly loggerService;
    private readonly notificationService;
    constructor(prisma: PrismaService, productsRepository: ProductsRepository, auditService: AuditService, loggerService: LoggerService, notificationService: NotificationService);
    private toResponse;
    findAll(query: ProductQueryDto, restrictToPublicChannels?: boolean): Promise<{
        data: ProductResponse[];
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
    }>;
    findById(id: string, restrictToPublicChannels?: boolean): Promise<ProductResponse>;
    findBySlug(slug: string, restrictToPublicChannels?: boolean): Promise<ProductResponse | null>;
    private generateUniqueSlug;
    private generateUniqueSku;
    private ensureUniqueBarcode;
    private generateUniqueBarcode;
    private validatePrices;
    private validateWeightDimensions;
    create(dto: CreateProductDto, userId: string): Promise<ProductResponse>;
    update(id: string, dto: UpdateProductDto, userId: string): Promise<ProductResponse>;
    delete(id: string, userId: string): Promise<void>;
    restore(id: string, userId: string): Promise<ProductResponse>;
    publish(id: string, userId: string): Promise<ProductResponse>;
    unpublish(id: string, userId: string): Promise<ProductResponse>;
    feature(id: string, userId: string): Promise<ProductResponse>;
    unfeature(id: string, userId: string): Promise<ProductResponse>;
    assignCategories(id: string, dto: AssignCategoriesDto, userId: string): Promise<ProductResponse>;
    removeCategory(id: string, categoryId: string): Promise<ProductResponse>;
    assignAttributes(id: string, dto: AssignAttributesDto, userId: string): Promise<ProductResponse>;
    removeAttribute(id: string, attributeId: string): Promise<ProductResponse>;
    assignRelatedProducts(id: string, dto: AssignRelatedProductsDto): Promise<ProductResponse>;
    removeRelatedProduct(id: string, relatedProductId: string): Promise<ProductResponse>;
    assignTags(id: string, dto: AssignTagsDto, userId: string): Promise<ProductResponse>;
    removeTag(id: string, tag: string, userId: string): Promise<ProductResponse>;
    assignCollections(id: string, dto: AssignCollectionsDto, userId: string): Promise<ProductResponse>;
    removeCollection(id: string, collection: string, userId: string): Promise<ProductResponse>;
    createColorGroup(id: string, dto: CreateColorGroupDto): Promise<{
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
    }>;
    getColorGroups(id: string): Promise<({
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
    })[]>;
    deleteColorGroup(productId: string, groupId: string): Promise<void>;
    syncColorGroups(productId: string, dto: SyncColorGroupsDto): Promise<({
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
    })[]>;
}
