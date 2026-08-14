import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customerId?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() endDate?: string;
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
  @ApiPropertyOptional({ default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class OrderItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiPropertyOptional() variantTitle?: string;
  @ApiProperty() sku!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() taxAmount!: number;
  @ApiProperty() discountAmount!: number;
}

export class OrderAddressResponse {
  @ApiProperty() id!: string;
  @ApiProperty() addressType!: string;
  @ApiProperty() fullName!: string;
  @ApiProperty() phone!: string;
  @ApiProperty() addressLine1!: string;
  @ApiPropertyOptional() addressLine2?: string;
  @ApiProperty() city!: string;
  @ApiProperty() state!: string;
  @ApiProperty() country!: string;
  @ApiProperty() postalCode!: string;
  @ApiPropertyOptional() landmark?: string;
}

export class OrderTimelineResponse {
  @ApiProperty() id!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() message?: string;
  @ApiPropertyOptional() createdBy?: string;
  @ApiProperty() createdAt!: Date;
}

export class OrderResponse {
  @ApiProperty() id!: string;
  @ApiProperty() orderNumber!: string;
  @ApiProperty() customerId!: string;
  @ApiProperty() status!: string;
  @ApiProperty() subtotal!: number;
  @ApiProperty() discountTotal!: number;
  @ApiProperty() taxTotal!: number;
  @ApiProperty() shippingCharge!: number;
  @ApiProperty() grandTotal!: number;
  @ApiProperty() currency!: string;
  @ApiPropertyOptional() notes?: string;
  @ApiPropertyOptional({
    description: 'Admin-only: sales channel. Omitted from customer-facing responses.',
  })
  channel?: string;
  @ApiPropertyOptional({
    description: 'Admin-only: POS payment method. Omitted from customer-facing responses.',
  })
  paymentMethod?: string;
  @ApiPropertyOptional({
    description: 'Admin-only: POS terminal ID. Omitted from customer-facing responses.',
  })
  terminalId?: string;
  @ApiPropertyOptional({ type: [OrderItemResponse] })
  items?: OrderItemResponse[];
  @ApiPropertyOptional({ type: [OrderAddressResponse] })
  addresses?: OrderAddressResponse[];
  @ApiPropertyOptional({ type: [OrderTimelineResponse] })
  timeline?: OrderTimelineResponse[];
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class OrderListResponse {
  @ApiProperty({ type: [OrderResponse] }) data!: OrderResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
