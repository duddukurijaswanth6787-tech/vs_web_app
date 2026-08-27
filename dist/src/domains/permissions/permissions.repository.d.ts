import { PrismaService } from "../../database/prisma.service";
export declare class PermissionsRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(module?: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        scope: import(".prisma/client").$Enums.PermissionScope;
        module: string;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        scope: import(".prisma/client").$Enums.PermissionScope;
        module: string;
    } | null>;
    findByCode(code: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        scope: import(".prisma/client").$Enums.PermissionScope;
        module: string;
    } | null>;
    create(data: {
        code: string;
        name: string;
        description?: string;
        module: string;
        scope?: string;
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        scope: import(".prisma/client").$Enums.PermissionScope;
        module: string;
    }>;
    update(id: string, data: {
        name?: string;
        description?: string;
        isActive?: boolean;
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        scope: import(".prisma/client").$Enums.PermissionScope;
        module: string;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        scope: import(".prisma/client").$Enums.PermissionScope;
        module: string;
    }>;
}
