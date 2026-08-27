import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LoggerService } from "../../common/logger/logger.service";
export declare class EmailVerificationService {
    private readonly prisma;
    private readonly auditService;
    private readonly loggerService;
    private readonly tokenExpiryMs;
    constructor(prisma: PrismaService, auditService: AuditService, loggerService: LoggerService);
    send(userId: string): Promise<{
        message: string;
    }>;
    resend(userId: string): Promise<{
        message: string;
    }>;
    verify(token: string): Promise<{
        message: string;
    }>;
    validateToken(token: string): Promise<{
        valid: boolean;
    }>;
}
