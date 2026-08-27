import { AuditService } from "../audit/audit.service";
import { NotificationRepository } from './notification.repository';
import { CreateNotificationDto, NotificationQueryDto, NotificationResponse } from './notification.types';
export declare class NotificationService {
    private readonly notificationRepository;
    private readonly auditService;
    constructor(notificationRepository: NotificationRepository, auditService: AuditService);
    private toResponse;
    findAll(userId: string, query: NotificationQueryDto): Promise<{
        data: NotificationResponse[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNext: boolean;
            hasPrevious: boolean;
        };
    }>;
    findById(id: string, userId: string): Promise<NotificationResponse>;
    create(dto: CreateNotificationDto): Promise<NotificationResponse>;
    markAsRead(id: string, userId: string): Promise<NotificationResponse>;
    markAllAsRead(userId: string): Promise<void>;
    archive(id: string, userId: string): Promise<NotificationResponse>;
    delete(id: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
    deleteAllRead(userId: string): Promise<number>;
    getStats(userId: string): Promise<{
        total: number;
        unread: number;
        read: number;
        archived: number;
    }>;
}
