import { PrismaService } from "../../database/prisma.service";
import { Prisma } from '@prisma/client';
export declare class AiAdminRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findTemplates(params: {
        search?: string;
        isActive?: boolean;
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            name: string;
            description: string | null;
            createdBy: string | null;
            updatedBy: string | null;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            version: number;
            template: string;
            variables: string[];
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
    findTemplateById(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        version: number;
        template: string;
        variables: string[];
    } | null>;
    findTemplateByName(name: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        version: number;
        template: string;
        variables: string[];
    } | null>;
    createTemplate(data: Prisma.AiPromptTemplateCreateInput): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        version: number;
        template: string;
        variables: string[];
    }>;
    updateTemplate(id: string, data: Prisma.AiPromptTemplateUpdateInput): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        version: number;
        template: string;
        variables: string[];
    }>;
    getUsageLogs(params: {
        page: number;
        limit: number;
    }): Promise<{
        data: {
            id: string;
            createdAt: Date;
            metadata: Prisma.JsonValue | null;
            userId: string | null;
            feature: string;
            tokensUsed: number;
            cost: Prisma.Decimal;
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
    createUsageLog(data: Prisma.AiUsageLogCreateInput): Promise<{
        id: string;
        createdAt: Date;
        metadata: Prisma.JsonValue | null;
        userId: string | null;
        feature: string;
        tokensUsed: number;
        cost: Prisma.Decimal;
    }>;
}
