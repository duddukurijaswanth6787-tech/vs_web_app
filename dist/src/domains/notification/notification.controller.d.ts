import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './notification.types';
import type { JwtPayload } from "../auth/services/jwt.service";
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    findAll(query: NotificationQueryDto, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        data: import("./notification.types").NotificationResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>>;
    getUnreadCount(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        count: number;
    }>>;
    getStats(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        total: number;
        unread: number;
        read: number;
        archived: number;
    }>>;
    markAllAsRead(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
    deleteAllRead(user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<{
        count: number;
    }>>;
    markAsRead(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<import("./notification.types").NotificationResponse>>;
    delete(id: string, user: JwtPayload): Promise<import("../../common/responses/response.builder").ResponsePayload<null>>;
}
