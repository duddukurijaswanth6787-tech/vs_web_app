import { ConfigService } from '@nestjs/config';
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { RegisterDeviceDto, SendPushDto } from './push-notification.types';
export declare class PushNotificationService {
    private readonly prisma;
    private readonly configService;
    private readonly auditService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, auditService: AuditService);
    registerDevice(userId: string, dto: RegisterDeviceDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        platform: string;
        token: string;
        userId: string;
        deviceName: string | null;
        lastUsedAt: Date | null;
    }>;
    unregisterDevice(userId: string, token: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        platform: string;
        token: string;
        userId: string;
        deviceName: string | null;
        lastUsedAt: Date | null;
    }>;
    listMyDevices(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        platform: string;
        token: string;
        userId: string;
        deviceName: string | null;
        lastUsedAt: Date | null;
    }[]>;
    send(dto: SendPushDto, actorId?: string): Promise<{
        error: string | null;
        id: string;
        status: string;
        createdAt: Date;
        data: import("@prisma/client/runtime/client").JsonValue | null;
        title: string;
        userId: string | null;
        body: string;
        targetCount: number;
        successCount: number;
    }>;
    listLogs(page?: number, limit?: number): Promise<{
        data: {
            error: string | null;
            id: string;
            status: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/client").JsonValue | null;
            title: string;
            userId: string | null;
            body: string;
            targetCount: number;
            successCount: number;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
        };
    }>;
}
