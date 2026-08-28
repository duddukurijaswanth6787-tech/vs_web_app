export declare const NotificationType: {
    readonly ORDER_CREATED: "ORDER_CREATED";
    readonly ORDER_CONFIRMED: "ORDER_CONFIRMED";
    readonly ORDER_CANCELLED: "ORDER_CANCELLED";
    readonly ORDER_RETURNED: "ORDER_RETURNED";
    readonly ORDER_DELIVERED: "ORDER_DELIVERED";
    readonly PAYMENT_FAILED: "PAYMENT_FAILED";
    readonly REFUND_COMPLETED: "REFUND_COMPLETED";
    readonly LOW_STOCK: "LOW_STOCK";
    readonly OUT_OF_STOCK: "OUT_OF_STOCK";
    readonly NEGATIVE_STOCK: "NEGATIVE_STOCK";
    readonly PRODUCT_CREATED: "PRODUCT_CREATED";
    readonly PRODUCT_UPDATED: "PRODUCT_UPDATED";
    readonly PRODUCT_DELETED: "PRODUCT_DELETED";
    readonly PRODUCT_DISABLED: "PRODUCT_DISABLED";
    readonly NEW_CUSTOMER: "NEW_CUSTOMER";
    readonly REVIEW_SUBMITTED: "REVIEW_SUBMITTED";
    readonly REVIEW_REPORTED: "REVIEW_REPORTED";
    readonly UPLOAD_COMPLETE: "UPLOAD_COMPLETE";
    readonly REPLACE_COMPLETE: "REPLACE_COMPLETE";
    readonly DELETE_WARNING: "DELETE_WARNING";
    readonly COUPON_EXPIRED: "COUPON_EXPIRED";
    readonly BANNER_EXPIRED: "BANNER_EXPIRED";
    readonly BUILD_STATUS: "BUILD_STATUS";
    readonly BACKGROUND_JOB: "BACKGROUND_JOB";
    readonly ERROR: "ERROR";
    readonly WARNING: "WARNING";
    readonly INFO: "INFO";
    readonly SUCCESS: "SUCCESS";
};
export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];
export declare class CreateNotificationDto {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
}
export declare class NotificationQueryDto {
    type?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
}
export declare class NotificationResponse {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    isArchived: boolean;
    readAt?: Date;
    createdAt: Date;
}
export declare class NotificationsStatsResponse {
    total: number;
    unread: number;
    read: number;
    archived: number;
}
export declare class NotificationListResponse {
    data: NotificationResponse[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export interface BulkActionResponse {
    count: number;
}
