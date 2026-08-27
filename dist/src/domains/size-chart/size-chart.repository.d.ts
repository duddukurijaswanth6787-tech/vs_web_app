import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
import { SizeChartRowDto } from './size-chart.types';
export declare class SizeChartRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        search?: string;
        garmentType?: string;
        status?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: ({
            rows: {
                id: string;
                displayOrder: number;
                createdAt: Date;
                updatedAt: Date;
                size: string;
                templateId: string;
                measurements: Prisma.JsonValue;
            }[];
        } & {
            id: string;
            slug: string;
            name: string;
            description: string | null;
            status: string;
            createdBy: string | null;
            updatedBy: string | null;
            deletedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            garmentType: string | null;
            unit: string;
        })[];
        total: number;
    }>;
    findById(id: string): Prisma.Prisma__SizeChartTemplateClient<({
        rows: {
            id: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            templateId: string;
            measurements: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        garmentType: string | null;
        unit: string;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    findBySlug(slug: string): Prisma.Prisma__SizeChartTemplateClient<({
        rows: {
            id: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            templateId: string;
            measurements: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        garmentType: string | null;
        unit: string;
    }) | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    findByProductId(productId: string): Promise<({
        rows: {
            id: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            templateId: string;
            measurements: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        garmentType: string | null;
        unit: string;
    }) | null>;
    slugExists(slug: string, excludeId?: string): Prisma.Prisma__SizeChartTemplateClient<{
        id: string;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    create(data: Omit<Prisma.SizeChartTemplateCreateInput, 'rows'>, rows: SizeChartRowDto[]): Prisma.Prisma__SizeChartTemplateClient<{
        rows: {
            id: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            templateId: string;
            measurements: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        garmentType: string | null;
        unit: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    update(id: string, data: Prisma.SizeChartTemplateUpdateInput, rows?: SizeChartRowDto[]): Promise<({
        rows: {
            id: string;
            displayOrder: number;
            createdAt: Date;
            updatedAt: Date;
            size: string;
            templateId: string;
            measurements: Prisma.JsonValue;
        }[];
    } & {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        garmentType: string | null;
        unit: string;
    }) | null>;
    softDelete(id: string): Prisma.Prisma__SizeChartTemplateClient<{
        id: string;
        slug: string;
        name: string;
        description: string | null;
        status: string;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        garmentType: string | null;
        unit: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    countProductsUsing(id: string): Prisma.PrismaPromise<number>;
}
