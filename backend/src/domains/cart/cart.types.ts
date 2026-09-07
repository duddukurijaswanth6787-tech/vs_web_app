import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() variantId?: string;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestId?: string;
}

export class UpdateQuantityDto {
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1) quantity!: number;
}

export class CartItemResponse {
  @ApiProperty() id!: string;
  @ApiProperty() cartId!: string;
  @ApiProperty() productId!: string;
  @ApiPropertyOptional() productName?: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() savedForLater!: boolean;
  @ApiProperty() createdAt!: Date;
  @ApiPropertyOptional() imageUrl?: string;
}

export class CartResponse {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() customerId?: string;
  @ApiPropertyOptional() guestId?: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional({ type: [CartItemResponse] }) items?: CartItemResponse[];
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() totalSavings!: number;
  @ApiProperty() createdAt!: Date;
}

export class CartSummaryResponse {
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() totalSavings!: number;
  @ApiProperty() mrpTotal!: number;
  @ApiProperty() saleTotal!: number;
  @ApiProperty() discountTotal!: number;
}

export class MergeCartDto {
  @ApiProperty() @IsString() guestId!: string;
}

export class SendCartRecoveryDto {
  @ApiPropertyOptional({ default: 'COMEBACK10' })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customMessage?: string;

  @ApiPropertyOptional({ enum: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP', 'ALL'], default: 'ALL' })
  @IsOptional()
  @IsString()
  channel?: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' | 'ALL';
}

export class BulkSendCartRecoveryDto extends SendCartRecoveryDto {
  @ApiProperty({ type: [String] })
  @IsOptional()
  cartIds?: string[];
}

export interface AbandonedCartItemSummary {
  productId: string;
  productName: string;
  variantTitle?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string;
}

export interface AbandonedCartEntry {
  cartId: string;
  customerId?: string;
  guestId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  isRegistered: boolean;
  itemCount: number;
  items: AbandonedCartItemSummary[];
  subtotal: number;
  lastActive: string;
  abandonedDurationHours: number;
  abandonedDurationFormatted: string;
  recoveryStatus: 'PENDING' | 'SENT' | 'RECOVERED';
  suggestedDiscountCode: string;
  checkoutResumeUrl: string;
}

export interface AbandonedCartStats {
  totalAbandonedCarts: number;
  totalPotentialRevenue: number;
  averageCartValue: number;
  highValueCartsCount: number;
  recoveredCartsCount: number;
  recoveryRatePercent: number;
}

export interface AbandonedCartListResponse {
  stats: AbandonedCartStats;
  carts: AbandonedCartEntry[];
}

