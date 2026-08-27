import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { SessionQueryDto, SessionResponse } from './session.types';
export declare class SessionService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(userId: string, query: SessionQueryDto): Promise<{
        data: SessionResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string, userId: string, userRoles: string[]): Promise<SessionResponse>;
    findCurrent(userId: string, ipAddress?: string, userAgent?: string): Promise<SessionResponse>;
    revoke(id: string, userId: string, userRoles: string[], revokedBy?: string): Promise<{
        message: string;
    }>;
    revokeCurrent(userId: string, ipAddress?: string, userAgent?: string): Promise<{
        message: string;
    }>;
    revokeOthers(userId: string, currentId: string): Promise<{
        message: string;
    }>;
    revokeAll(userId: string): Promise<{
        message: string;
    }>;
    revokeAllForUser(adminUserId: string, targetUserId: string): Promise<{
        message: string;
    }>;
    revokeExpired(): Promise<{
        message: string;
    }>;
    getStats(): Promise<{
        activeSessions: number;
        expiredSessions: number;
        revokedSessions: number;
    }>;
    private toResponse;
}
