import { LoggerService } from "../../common/logger/logger.service";
import { AuthRepository } from './auth.repository';
import { PasswordService } from './services/password.service';
import { JwtService, JwtPayload } from './services/jwt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { GoogleAuthService } from './services/google-auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, GoogleLoginDto, AuthTokensResponse, MeResponse } from './auth.types';
export declare class AuthService {
    private readonly authRepository;
    private readonly passwordService;
    private readonly jwtService;
    private readonly refreshTokenService;
    private readonly googleAuthService;
    private readonly loggerService;
    constructor(authRepository: AuthRepository, passwordService: PasswordService, jwtService: JwtService, refreshTokenService: RefreshTokenService, googleAuthService: GoogleAuthService, loggerService: LoggerService);
    seedAdmin(): Promise<{
        email: string;
        seeded: boolean;
        categoriesSeeded: boolean;
    }>;
    register(dto: RegisterDto, ip?: string, userAgent?: string): Promise<AuthTokensResponse>;
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<AuthTokensResponse>;
    issueTokensForUser(userId: string, ip?: string, userAgent?: string, rememberMe?: boolean): Promise<AuthTokensResponse>;
    logout(refreshToken: string): Promise<void>;
    refresh(refreshToken: string, ip?: string, userAgent?: string): Promise<AuthTokensResponse | null>;
    me(userId: string): Promise<MeResponse>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
    verifyToken(token: string): JwtPayload;
    googleLogin(dto: GoogleLoginDto, ip?: string, userAgent?: string): Promise<AuthTokensResponse>;
}
