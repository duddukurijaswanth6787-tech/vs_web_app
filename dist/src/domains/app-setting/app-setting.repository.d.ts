import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class AppSettingRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(params: {
        group?: string;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            type: string;
            value: string;
            key: string;
            group: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findByKey(key: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        value: string;
        key: string;
        group: string | null;
    } | null>;
    create(data: Prisma.AppSettingCreateInput): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        value: string;
        key: string;
        group: string | null;
    }>;
    update(id: string, data: Prisma.AppSettingUpdateInput): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        value: string;
        key: string;
        group: string | null;
    }>;
    findById(id: string): Promise<{
        id: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        value: string;
        key: string;
        group: string | null;
    } | null>;
    getByKey(key: string): Promise<string | null>;
}
