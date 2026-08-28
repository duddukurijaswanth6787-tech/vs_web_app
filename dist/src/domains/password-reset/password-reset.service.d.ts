import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
import { PasswordService } from "../auth/services/password.service";
import { AuditService } from "../audit/audit.service";
import { EmailService } from "../email/email.service";
import { LoggerService } from "../../common/logger/logger.service";
export declare class PasswordResetService {
    private readonly prisma;
    private readonly passwordService;
    private readonly auditService;
    private readonly loggerService;
    private readonly emailService;
    private readonly configService;
    private readonly tokenExpiryMs;
    constructor(prisma: PrismaService, passwordService: PasswordService, auditService: AuditService, loggerService: LoggerService, emailService: EmailService, configService: ConfigService);
    forgot(email: string): Promise<{
        message: string;
    }>;
    reset(token: string, newPassword: string, ipAddress?: string, userAgent?: string): Promise<{
        message: string;
    }>;
    validateToken(token: string): Promise<{
        valid: boolean;
    }>;
}
