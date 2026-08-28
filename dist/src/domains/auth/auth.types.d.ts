export declare class RegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
}
export declare class LoginDto {
    email?: string;
    username?: string;
    password: string;
    rememberMe?: any;
}
export declare class GoogleLoginDto {
    credential: string;
    rememberMe?: boolean;
}
export declare class RefreshDto {
    refreshToken?: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class AuthTokensResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export declare class UserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    userType: string;
    accountStatus: string;
}
export declare class MeResponse extends UserResponse {
    roles: string[];
    permissions: string[];
}
