"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const session_types_1 = require("./session.types");
let SessionService = class SessionService {
    prisma;
    auditService;
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async findAll(userId, query) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy ?? 'lastActivityAt';
        const sortOrder = query.sortOrder ?? 'desc';
        const where = { userId };
        if (query.search) {
            where.OR = [
                { ipAddress: { contains: query.search, mode: 'insensitive' } },
                { userAgent: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.startDate || query.endDate) {
            where.createdAt = {};
            if (query.startDate)
                where.createdAt.gte = new Date(query.startDate);
            if (query.endDate)
                where.createdAt.lte = new Date(query.endDate);
        }
        const [data, total] = await Promise.all([
            this.prisma.refreshToken.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            this.prisma.refreshToken.count({ where }),
        ]);
        const sessions = data.map((s) => this.toResponse(s));
        return {
            data: sessions,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
                hasNext: page < Math.ceil(total / limit),
                hasPrevious: page > 1,
            },
        };
    }
    async findById(id, userId, userRoles) {
        const session = await this.prisma.refreshToken.findUnique({
            where: { id },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        if (session.userId !== userId &&
            !userRoles?.some((r) => ['super_admin', 'admin'].includes(r)))
            throw new common_1.ForbiddenException('Access denied');
        return this.toResponse(session);
    }
    async findCurrent(userId, ipAddress, userAgent) {
        const where = { userId };
        if (ipAddress)
            where.ipAddress = ipAddress;
        if (userAgent)
            where.userAgent = userAgent;
        const session = await this.prisma.refreshToken.findFirst({
            where,
            orderBy: { lastActivityAt: 'desc' },
        });
        if (!session)
            throw new common_1.NotFoundException('Current session not found');
        return this.toResponse(session);
    }
    async revoke(id, userId, userRoles, revokedBy) {
        const session = await this.prisma.refreshToken.findUnique({
            where: { id },
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        if (session.userId !== userId &&
            !userRoles?.some((r) => ['super_admin', 'admin'].includes(r)))
            throw new common_1.ForbiddenException('Access denied');
        await this.prisma.refreshToken.update({
            where: { id },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        await this.auditService.log({
            action: 'SESSION_REVOKED',
            module: 'session',
            resource: 'refresh_token',
            resourceId: id,
            userId,
            metadata: { revokedBy, targetUserId: session.userId },
        });
        return { message: 'Session revoked successfully' };
    }
    async revokeCurrent(userId, ipAddress, userAgent) {
        const where = { userId, isRevoked: false };
        if (ipAddress || userAgent) {
            where.OR = [];
            if (ipAddress)
                where.OR.push({ ipAddress });
            if (userAgent)
                where.OR.push({ userAgent });
        }
        const result = await this.prisma.refreshToken.updateMany({
            where,
            data: { isRevoked: true, revokedAt: new Date() },
        });
        await this.auditService.log({
            action: 'LOGOUT',
            module: 'session',
            resource: 'refresh_token',
            userId,
            metadata: { count: result.count, ipAddress, userAgent },
        });
        return { message: `Revoked ${result.count} session(s)` };
    }
    async revokeOthers(userId, currentId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false, id: { not: currentId } },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        await this.auditService.log({
            action: 'LOGOUT_OTHERS',
            module: 'session',
            resource: 'refresh_token',
            userId,
        });
        return { message: 'Other sessions revoked' };
    }
    async revokeAll(userId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        await this.auditService.log({
            action: 'LOGOUT_ALL',
            module: 'session',
            resource: 'refresh_token',
            userId,
        });
        return { message: 'All sessions revoked' };
    }
    async revokeAllForUser(adminUserId, targetUserId) {
        await this.prisma.refreshToken.updateMany({
            where: { userId: targetUserId, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        await this.auditService.log({
            action: 'ADMIN_REVOKE_ALL',
            module: 'session',
            resource: 'refresh_token',
            userId: adminUserId,
            metadata: { targetUserId },
        });
        return { message: `All sessions revoked for user ${targetUserId}` };
    }
    async revokeExpired() {
        const result = await this.prisma.refreshToken.updateMany({
            where: { isRevoked: false, expiresAt: { lt: new Date() } },
            data: { isRevoked: true, revokedAt: new Date() },
        });
        await this.auditService.log({
            action: 'EXPIRED_SESSION_CLEANUP',
            module: 'session',
            resource: 'refresh_token',
            metadata: { count: result.count },
        });
        return { message: `Revoked ${result.count} expired session(s)` };
    }
    async getStats() {
        const now = new Date();
        const [active, expired, revoked] = await Promise.all([
            this.prisma.refreshToken.count({
                where: { isRevoked: false, expiresAt: { gt: now } },
            }),
            this.prisma.refreshToken.count({
                where: { isRevoked: false, expiresAt: { lt: now } },
            }),
            this.prisma.refreshToken.count({ where: { isRevoked: true } }),
        ]);
        return {
            activeSessions: active,
            expiredSessions: expired,
            revokedSessions: revoked,
        };
    }
    toResponse(s) {
        const resp = new session_types_1.SessionResponse();
        Object.assign(resp, {
            id: s.id,
            userId: s.userId,
            ipAddress: s.ipAddress ?? undefined,
            userAgent: s.userAgent ?? undefined,
            isRevoked: s.isRevoked,
            revokedAt: s.revokedAt ?? undefined,
            createdAt: s.createdAt,
            lastActivityAt: s.lastActivityAt,
            expiresAt: s.expiresAt,
            isExpired: s.expiresAt < new Date(),
        });
        return resp;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], SessionService);
//# sourceMappingURL=session.service.js.map