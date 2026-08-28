import type { Request } from 'express';
import { SessionService } from './session.service';
import { SessionQueryDto } from './session.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class SessionController {
    private readonly sessionService;
    constructor(sessionService: SessionService);
    findAll(user: JwtPayload, query: SessionQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./session.types").SessionResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    findCurrent(user: JwtPayload, req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./session.types").SessionResponse>>;
    getStats(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        activeSessions: number;
        expiredSessions: number;
        revokedSessions: number;
    }>>;
    findById(user: JwtPayload, id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./session.types").SessionResponse>>;
    revokeCurrent(user: JwtPayload, req: Request): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    revoke(user: JwtPayload, id: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    revokeOthers(user: JwtPayload, currentId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    revokeAll(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    revokeExpired(): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
    adminFindAll(userId: string, query: SessionQueryDto): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./session.types").SessionResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    adminRevokeAll(user: JwtPayload, targetUserId: string): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        message: string;
    }>>;
}
