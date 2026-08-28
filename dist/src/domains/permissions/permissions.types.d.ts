export declare class CreatePermissionDto {
    code: string;
    name: string;
    description?: string;
    module: string;
    scope?: string;
}
export declare class UpdatePermissionDto {
    name?: string;
    description?: string;
    isActive?: boolean;
}
export declare class PermissionResponse {
    id: string;
    code: string;
    name: string;
    module: string;
    scope: string;
    isActive: boolean;
}
