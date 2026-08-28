import { PrismaService } from "../../../database/prisma.service";
import { SessionSettingsService } from './session-settings.service';
export declare class RefreshTokenService {
    private readonly prisma;
    private readonly sessionSettingsService;
    constructor(prisma: PrismaService, sessionSettingsService: SessionSettingsService);
    create(userId: string, ipAddress?: string, userAgent?: string, rememberMe?: boolean): Promise<string>;
    validate(token: string): Promise<{
        id: string;
        createdAt: Date;
        expiresAt: Date;
        token: string;
        userId: string;
        ipAddress: string | null;
        userAgent: string | null;
        loginProvider: import(".prisma/client").$Enums.LoginProvider;
        lastActivityAt: Date;
        isRevoked: boolean;
        revokedAt: Date | null;
    } | null>;
    revoke(token: string): Promise<void>;
    rotate(token: string, ipAddress?: string, userAgent?: string, rememberMe?: boolean): Promise<{
        accessToken: string;
        refreshToken: string;
    } | null>;
    revokeAllForUser(userId: string): Promise<void>;
}
