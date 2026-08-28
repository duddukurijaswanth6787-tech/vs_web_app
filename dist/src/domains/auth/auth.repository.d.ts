import { PrismaService } from "../../database/prisma.service";
export declare class AuthRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(emailInput: string): Promise<({
        userRoles: ({
            role: {
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
            };
        } & {
            assignedBy: string | null;
            assignedAt: Date;
            expiresAt: Date | null;
            roleId: string;
            userId: string;
        })[];
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }) | null>;
    findById(id: string): Promise<({
        userRoles: ({
            role: {
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
            };
        } & {
            assignedBy: string | null;
            assignedAt: Date;
            expiresAt: Date | null;
            roleId: string;
            userId: string;
        })[];
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }) | null>;
    hasSuperAdmin(): Promise<boolean>;
    seedAdmin(): Promise<{
        email: string;
        seeded: boolean;
        categoriesSeeded: boolean;
    }>;
    findByEmailBasic(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
    } | null>;
    findByIdBasic(id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
    } | null>;
    findByPhone(phone: string): Promise<({
        userRoles: ({
            role: {
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
            };
        } & {
            assignedBy: string | null;
            assignedAt: Date;
            expiresAt: Date | null;
            roleId: string;
            userId: string;
        })[];
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }) | null>;
    createUser(data: {
        email: string;
        passwordHash: string;
        firstName: string;
        lastName?: string;
        phone?: string;
        isPhoneVerified?: boolean;
        isEmailVerified?: boolean;
        googleId?: string;
        avatar?: string;
    }): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }>;
    findByGoogleId(googleId: string): Promise<({
        userRoles: ({
            role: {
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
            };
        } & {
            assignedBy: string | null;
            assignedAt: Date;
            expiresAt: Date | null;
            roleId: string;
            userId: string;
        })[];
    } & {
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }) | null>;
    linkGoogleId(userId: string, googleId: string): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }>;
    assignRole(userId: string, roleId: string): Promise<{
        assignedBy: string | null;
        assignedAt: Date;
        expiresAt: Date | null;
        roleId: string;
        userId: string;
    }>;
    findRoleByName(name: string): Promise<{
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
    updateLoginAttempts(userId: string, attempts: number, lockoutUntil?: Date | null): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }>;
    resetLoginAttempts(userId: string): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }>;
    updatePassword(userId: string, passwordHash: string): Promise<{
        id: string;
        deletedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
        country: string;
        phone: string | null;
        email: string;
        gender: import(".prisma/client").$Enums.Gender | null;
        language: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        googleId: string | null;
        facebookId: string | null;
        appleId: string | null;
        passwordHash: string;
        userType: import(".prisma/client").$Enums.UserType;
        accountStatus: import(".prisma/client").$Enums.AccountStatus;
        firstName: string;
        lastName: string | null;
        avatar: string | null;
        lastLoginAt: Date | null;
        loginAttempts: number;
        lockoutUntil: Date | null;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
    }>;
}
