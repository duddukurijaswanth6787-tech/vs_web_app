import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsIn,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Physical sticker label size. SMALL is the original 50x25mm garment-tag
 * design (barcode only -- no room for a legible QR). MEDIUM (75x40mm) and
 * LARGE (100x50mm) add a QR code and, for LARGE, a fuller branded layout.
 * See BarcodeService.LABEL_SPECS for the exact dimensions/layout per size.
 */
export type LabelSize = 'SMALL' | 'MEDIUM' | 'LARGE';

export enum PosPaymentMethodType {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  CREDIT = 'CREDIT',
  SPLIT = 'SPLIT',
}

export class PosCartItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty()
  @IsString()
  productName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantTitle?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  taxAmount?: number;
}

export class PosCustomerInfoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;
}

export class ScanBarcodeDto {
  @ApiProperty({ description: 'Variant Barcode or SKU code' })
  @IsString()
  barcode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopId?: string;
}

export class CreateCheckoutSessionDto {
  @ApiProperty({ type: [PosCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosCartItemDto)
  items!: PosCartItemDto[];

  @ApiPropertyOptional({ type: PosCustomerInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosCustomerInfoDto)
  customer?: PosCustomerInfoDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountTotal?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  taxTotal?: number;
}

export class AdoptHandoffTokenDto {
  @ApiProperty({ description: '6-digit handoff PIN or token string' })
  @IsString()
  handoffToken!: string;
}

/**
 * Terminal a POS sale is billed against when the client does not name one.
 * Sales are attributed to a shift by terminalId + time window (there is no
 * shift foreign key on Order), so this value decides whose drawer the cash
 * lands in -- it must stay in step with the fallback used when the order row
 * is created.
 */
export const DEFAULT_TERMINAL_ID = 'COUNTER_1';

export class CompletePosSaleDto {
  @ApiPropertyOptional({
    description: 'Checkout Session ID if initiated via Mobile Handoff',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ type: [PosCartItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosCartItemDto)
  items?: PosCartItemDto[];

  @ApiProperty({
    enum: PosPaymentMethodType,
    default: PosPaymentMethodType.UPI,
  })
  @IsEnum(PosPaymentMethodType)
  paymentMethod!: PosPaymentMethodType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amountPaid!: number;

  @ApiPropertyOptional({ type: PosCustomerInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosCustomerInfoDto)
  customer?: PosCustomerInfoDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terminalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shopId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  discountTotal?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  taxTotal?: number;

  @ApiPropertyOptional({
    description:
      'Client-generated order number for offline-queued sales. Used as an idempotency key: replaying the same clientOrderNumber (e.g. a retried sync after a dropped connection) returns the already-created order instead of creating a duplicate.',
  })
  @IsOptional()
  @IsString()
  clientOrderNumber?: string;

  @ApiPropertyOptional({
    description:
      'True when this sale is being synced from the offline queue rather than submitted live. Triggers a stock-sufficiency check before the order is created, since stock may have moved while the terminal was offline.',
  })
  @IsOptional()
  @IsBoolean()
  isOfflineSync?: boolean;
}

export class BarcodeScanResultResponse {
  @ApiProperty() productId!: string;
  @ApiProperty() productName!: string;
  @ApiPropertyOptional() variantId?: string;
  @ApiPropertyOptional() sku?: string;
  @ApiPropertyOptional() barcode?: string;
  @ApiPropertyOptional() variantTitle?: string;
  @ApiProperty() price!: number;
  @ApiPropertyOptional() costPrice?: number;
  @ApiProperty() availableStock!: number;
  @ApiPropertyOptional() primaryImage?: string;
}

export class CheckoutSessionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() sessionId!: string;
  @ApiProperty() handoffToken!: string;
  @ApiProperty() status!: string;
  @ApiProperty() subtotal!: number;
  @ApiProperty() discountTotal!: number;
  @ApiProperty() taxTotal!: number;
  @ApiProperty() grandTotal!: number;
  @ApiProperty() items!: PosCartItemDto[];
  @ApiPropertyOptional() customer?: PosCustomerInfoDto;
  @ApiProperty() expiresAt!: Date;
  @ApiProperty() createdAt!: Date;
}
export class GenerateBarcodeImageDto {
  @ApiProperty({ description: 'Text or number to encode' })
  @IsString()
  code!: string;

  @ApiPropertyOptional({ default: 'code128' })
  @IsOptional()
  @IsString()
  bcid?: string;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  @IsNumber()
  scale?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  height?: number;
}

export class GenerateBatchStickersDto {
  @ApiProperty()
  @IsString()
  productName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantTitle?: string;

  @ApiProperty()
  @IsString()
  sku!: string;

  @ApiProperty()
  @IsString()
  barcode!: string;

  @ApiProperty()
  @IsNumber()
  price!: number;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ default: 'Vasanthi Designers' })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional({
    enum: ['SMALL', 'MEDIUM', 'LARGE'],
    default: 'SMALL',
    description:
      'SMALL 50x25mm (barcode only), MEDIUM 75x40mm (adds a QR code), LARGE 100x50mm (full branded design with QR)',
  })
  @IsOptional()
  @IsIn(['SMALL', 'MEDIUM', 'LARGE'])
  labelSize?: LabelSize;
}

export class OpenPosShiftDto {
  @ApiProperty()
  @IsString()
  terminalId!: string;

  @ApiProperty({ description: 'Starting cash float counted into the drawer' })
  @IsNumber()
  @Min(0)
  openingCash!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClosePosShiftDto {
  @ApiProperty({ description: 'Physical cash counted in the drawer at close' })
  @IsNumber()
  @Min(0)
  closingCashCounted!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PreviewReceiptDto {
  @ApiProperty()
  @IsString()
  orderNumber!: string;

  @ApiProperty()
  @IsNumber()
  grandTotal!: number;

  @ApiProperty({ type: [PosCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosCartItemDto)
  items!: PosCartItemDto[];

  @ApiPropertyOptional({ type: PosCustomerInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosCustomerInfoDto)
  customer?: PosCustomerInfoDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  discountTotal?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  taxTotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cashierName?: string;

  @ApiPropertyOptional({
    description: 'Payment gateway transaction/reference ID, if this sale went through one (e.g. UPI/card). Omitted for cash sales.',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
