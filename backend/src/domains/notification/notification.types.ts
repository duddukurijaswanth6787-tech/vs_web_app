import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// Notification type constants
export const NotificationType = {
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_CANCELLED: 'ORDER_CANCELLED',
  ORDER_RETURNED: 'ORDER_RETURNED',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_COMPLETED: 'REFUND_COMPLETED',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  NEGATIVE_STOCK: 'NEGATIVE_STOCK',
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  PRODUCT_DISABLED: 'PRODUCT_DISABLED',
  NEW_CUSTOMER: 'NEW_CUSTOMER',
  REVIEW_SUBMITTED: 'REVIEW_SUBMITTED',
  REVIEW_REPORTED: 'REVIEW_REPORTED',
  UPLOAD_COMPLETE: 'UPLOAD_COMPLETE',
  REPLACE_COMPLETE: 'REPLACE_COMPLETE',
  DELETE_WARNING: 'DELETE_WARNING',
  COUPON_EXPIRED: 'COUPON_EXPIRED',
  BANNER_EXPIRED: 'BANNER_EXPIRED',
  BUILD_STATUS: 'BUILD_STATUS',
  BACKGROUND_JOB: 'BACKGROUND_JOB',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export class CreateNotificationDto {
  @ApiProperty() @IsString() userId!: string;
  @ApiProperty() @IsString() type!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() message!: string;
  @ApiPropertyOptional() @IsOptional() data?: any;
}

export class NotificationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() type?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class NotificationResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() type!: string;
  @ApiProperty() title!: string;
  @ApiProperty() message!: string;
  @ApiPropertyOptional() data?: any;
  @ApiProperty() isRead!: boolean;
  @ApiProperty() isArchived!: boolean;
  @ApiPropertyOptional() readAt?: Date;
  @ApiProperty() createdAt!: Date;
}

export class NotificationsStatsResponse {
  @ApiProperty() total!: number;
  @ApiProperty() unread!: number;
  @ApiProperty() read!: number;
  @ApiProperty() archived!: number;
}

export class NotificationListResponse {
  @ApiProperty({ type: [NotificationResponse] }) data!: NotificationResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

// ponytail: shared user ID param, avoids per-route DTO
export interface BulkActionResponse {
  count: number;
}
