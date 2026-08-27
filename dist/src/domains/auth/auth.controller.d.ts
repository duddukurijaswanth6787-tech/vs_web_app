import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { RegisterDto, LoginDto, RefreshDto, ChangePasswordDto, GoogleLoginDto, AuthTokensResponse } from './auth.types';
import type { JwtPayload } from './services/jwt.service';
export declare class AuthController {
    private readonly authService;
    private readonly googleAuthService;
    constructor(authService: AuthService, googleAuthService: GoogleAuthService);
    seedAdmin(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        email: string;
        seeded: boolean;
        categoriesSeeded: boolean;
    }>>;
    register(dto: RegisterDto, req: Request, res: Response): Promise<import("../../common/responses/response.builder").ResponsePayload<Omit<AuthTokensResponse, "refreshToken">>>;
    login(dto: LoginDto, req: Request, res: Response): Promise<import("../../common/responses/response.builder").ResponsePayload<Omit<AuthTokensResponse, "refreshToken">>>;
    googleClientId(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        clientId: string;
    }>>;
    googleAuth(dto: GoogleLoginDto, req: Request, res: Response): Promise<import("../../common/responses/response.builder").ResponsePayload<Omit<AuthTokensResponse, "refreshToken">>>;
    logout(dto: RefreshDto, req: Request, res: Response): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    refresh(dto: RefreshDto, req: Request, res: Response): Promise<import("../../common/responses/response.builder").ResponsePayload<Omit<AuthTokensResponse, "refreshToken">>>;
    me(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./auth.types").MeResponse>>;
    changePassword(user: JwtPayload, dto: ChangePasswordDto): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    verifyToken(body: {
        token: string;
    }): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        valid: boolean;
    }>>;
}
