import { PrismaService } from "../../database/prisma.service";
export declare class RolesRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        rolePermissions: ({
            permission: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                isActive: boolean;
                scope: import(".prisma/client").$Enums.PermissionScope;
                module: string;
            };
        } & {
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        scope: import(".prisma/client").$Enums.RoleScope;
        hierarchy: number;
        isSystem: boolean;
    })[]>;
    findById(id: string): Promise<({
        rolePermissions: ({
            permission: {
                id: string;
                name: string;
                description: string | null;
                createdAt: Date;
                updatedAt: Date;
                code: string;
                isActive: boolean;
                scope: import(".prisma/client").$Enums.PermissionScope;
                module: string;
            };
        } & {
            roleId: string;
            permissionId: string;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        scope: import(".prisma/client").$Enums.RoleScope;
        hierarchy: number;
        isSystem: boolean;
    }) | null>;
    findByName(name: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        scope: import(".prisma/client").$Enums.RoleScope;
        hierarchy: number;
        isSystem: boolean;
    } | null>;
    create(data: {
        name: string;
        displayName: string;
        description?: string;
        scope?: string;
        hierarchy?: number;
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        scope: import(".prisma/client").$Enums.RoleScope;
        hierarchy: number;
        isSystem: boolean;
    }>;
    update(id: string, data: {
        displayName?: string;
        description?: string;
        hierarchy?: number;
        isActive?: boolean;
    }): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        scope: import(".prisma/client").$Enums.RoleScope;
        hierarchy: number;
        isSystem: boolean;
    }>;
    delete(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        displayName: string;
        scope: import(".prisma/client").$Enums.RoleScope;
        hierarchy: number;
        isSystem: boolean;
    }>;
    assignPermissions(roleId: string, permissionIds: string[]): Promise<void>;
    removePermission(roleId: string, permissionId: string): Promise<void>;
}
