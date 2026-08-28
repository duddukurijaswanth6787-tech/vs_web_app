import { Gender } from "../../shared/identity/identity.enums";
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    gender?: Gender;
}
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    gender?: Gender;
}
export declare class AssignRoleDto {
    roleId: string;
}
export declare class UserQueryDto {
    search?: string;
    status?: string;
    userType?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class UserListResponse {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    userType: string;
    accountStatus: string;
    isEmailVerified: boolean;
    lastLoginAt?: Date;
    createdAt: Date;
}
export declare class UserDetailResponse extends UserListResponse {
    phone?: string;
    gender?: string;
    roles: string[];
    permissions: string[];
}
