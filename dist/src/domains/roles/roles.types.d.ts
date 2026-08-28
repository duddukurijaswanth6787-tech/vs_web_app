export declare class CreateRoleDto {
    name: string;
    displayName: string;
    description?: string;
    scope?: string;
    hierarchy?: number;
}
export declare class UpdateRoleDto {
    displayName?: string;
    description?: string;
    hierarchy?: number;
    isActive?: boolean;
}
export declare class AssignPermissionsDto {
    permissionIds: string[];
}
export declare class RoleResponse {
    id: string;
    name: string;
    displayName: string;
    scope: string;
    hierarchy: number;
    isSystem: boolean;
    isActive: boolean;
    permissions: string[];
}
