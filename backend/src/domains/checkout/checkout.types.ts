import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export const CHECKOUT_PAYMENT_METHODS = ['COD', 'RAZORPAY'] as const;
export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

export class CheckoutPreviewDto {
  @ApiProperty() @IsUUID() addressId!: string;
  @ApiPropertyOptional({ default: 'STANDARD' })
  @IsOptional()
  @IsString()
  shippingMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() couponCode?: string;
}

export class CheckoutItemResponse {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() totalPrice!: number;
  @ApiProperty() taxAmount!: number;
}

export class CheckoutSummaryResponse {
  @ApiProperty({ type: [CheckoutItemResponse] }) items!: CheckoutItemResponse[];
  @ApiProperty() itemCount!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() discountTotal!: number;
  @ApiProperty() taxTotal!: number;
  @ApiProperty() shippingCharge!: number;
  @ApiProperty() grandTotal!: number;
  @ApiProperty() estimatedDelivery!: string;
}

export class PlaceOrderDto {
  @ApiProperty() @IsUUID() addressId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shippingMethod?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deliveryInstructions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredDeliverySlot?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() terminalId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() couponCode?: string;
  @ApiPropertyOptional() @IsOptional() isGift?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() giftWrapMessage?: string;

  @ApiPropertyOptional({ enum: CHECKOUT_PAYMENT_METHODS, default: 'COD' })
  @IsOptional()
  @IsIn(CHECKOUT_PAYMENT_METHODS)
  paymentMethod?: CheckoutPaymentMethod;
}

export class PlaceOrderPaymentResponse {
  @ApiProperty() paymentId!: string;
  @ApiProperty() providerOrderId!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() currency!: string;
  @ApiProperty() razorpayKeyId!: string;
}
