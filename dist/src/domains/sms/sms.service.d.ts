import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SendSmsDto, SendOrderSmsDto } from './sms.types';
export declare class SmsService {
    private readonly prisma;
    private readonly configService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, auditService: AuditService);
    private isEnabled;
    send(dto: SendSmsDto, actorId?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        phone: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        message: string;
        template: string;
        providerRef: string | null;
    }>;
    sendOrderSms(dto: SendOrderSmsDto, actorId?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        phone: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        message: string;
        template: string;
        providerRef: string | null;
    }>;
    sendOtpSms(phone: string, code: string, userId?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        phone: string;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
        userId: string | null;
        message: string;
        template: string;
        providerRef: string | null;
    }>;
    listLogs(page?: number, limit?: number): Promise<{
        data: {
            error: string | null;
            id: string;
            status: string;
            createdAt: Date;
            phone: string;
            metadata: import("@prisma/client/runtime/client").JsonValue | null;
            userId: string | null;
            message: string;
            template: string;
            providerRef: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
