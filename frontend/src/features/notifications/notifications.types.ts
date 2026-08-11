export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}

export interface NotificationQueryDto {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

// Notification type constants (mirrors backend)
export const NotificationType = {
  // Orders
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_RETURNED: 'ORDER_RETURNED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_COMPLETED: 'REFUND_COMPLETED',
  // Inventory
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  NEGATIVE_STOCK: 'NEGATIVE_STOCK',
  PRODUCT_DISABLED: 'PRODUCT_DISABLED',
  // Customers
  NEW_CUSTOMER: 'NEW_CUSTOMER',
  REVIEW_SUBMITTED: 'REVIEW_SUBMITTED',
  REVIEW_REPORTED: 'REVIEW_REPORTED',
  // Media
  UPLOAD_COMPLETE: 'UPLOAD_COMPLETE',
  REPLACE_COMPLETE: 'REPLACE_COMPLETE',
  DELETE_WARNING: 'DELETE_WARNING',
  // System
  BUILD_STATUS: 'BUILD_STATUS',
  BACKGROUND_JOB: 'BACKGROUND_JOB',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

// ponytail: group types by category for filtering
export const NOTIFICATION_GROUPS = {
  Orders: [NotificationType.ORDER_CREATED, NotificationType.ORDER_CANCELLED, NotificationType.ORDER_RETURNED, NotificationType.PAYMENT_FAILED, NotificationType.REFUND_COMPLETED],
  Inventory: [NotificationType.LOW_STOCK, NotificationType.OUT_OF_STOCK, NotificationType.NEGATIVE_STOCK, NotificationType.PRODUCT_DISABLED],
  Customers: [NotificationType.NEW_CUSTOMER, NotificationType.REVIEW_SUBMITTED, NotificationType.REVIEW_REPORTED],
  Media: [NotificationType.UPLOAD_COMPLETE, NotificationType.REPLACE_COMPLETE, NotificationType.DELETE_WARNING],
  System: [NotificationType.BUILD_STATUS, NotificationType.BACKGROUND_JOB, NotificationType.ERROR, NotificationType.WARNING],
} as const;
