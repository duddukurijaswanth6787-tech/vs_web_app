import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsPhoneNumberCustom,
  IsHsnCodeCustom,
  IsGSTCustom,
  IsMoneyCustom,
} from '@common/validation/decorators.validation';

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
  @IsPhoneNumberCustom()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description:
      "Customer's state. When it differs from the shop's state the invoice " +
      'switches from CGST + SGST to a single IGST line, as GST law requires. ' +
      'Optional; walk-in sales default to the shop\'s state.',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({
    description:
      'Customer GSTIN for B2B sales; printed on the tax invoice so the buyer ' +
      'can claim the input credit.',
  })
  @IsOptional()
  @IsGSTCustom()
  gstin?: string;
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

  @ApiPropertyOptional({
    description:
      'Park this cart at the till instead of handing it to a phone. Held ' +
      'carts are listed for the counter to pick back up and last the shift ' +
      'rather than the 30 minutes a handoff gets.',
  })
  @IsOptional()
  @IsBoolean()
  hold?: boolean;
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

/** How the money goes back to the customer at the till. */
export enum PosRefundMethodType {
  CASH = 'CASH',
  UPI = 'UPI',
  CARD = 'CARD',
  /** Whatever the sale was paid with. */
  ORIGINAL = 'ORIGINAL',
}

export class PosReturnItemDto {
  @ApiProperty({ description: 'OrderItem being returned' })
  @IsString()
  orderItemId!: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePosReturnDto {
  @ApiProperty({ description: 'Order number from the customer receipt' })
  @IsString()
  orderNumber!: string;

  @ApiProperty({ type: [PosReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosReturnItemDto)
  items!: PosReturnItemDto[];

  @ApiProperty({ enum: PosRefundMethodType })
  @IsEnum(PosRefundMethodType)
  refundMethod!: PosRefundMethodType;

  @ApiProperty()
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    description:
      'Register the refund is paid out from. Decides which drawer the cash comes out of at close.',
  })
  @IsOptional()
  @IsString()
  terminalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PosSplitTenderDto {
  @ApiProperty({
    enum: PosPaymentMethodType,
    description: 'How this part of the bill was paid.',
  })
  @IsEnum(PosPaymentMethodType)
  method!: PosPaymentMethodType;

  @ApiProperty({ description: 'Amount handed over on this tender.' })
  @IsMoneyCustom()
  amount!: number;
}

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

  @ApiPropertyOptional({
    type: [PosSplitTenderDto],
    description:
      'Tenders when paymentMethod is SPLIT. Each is recorded as its own ' +
      'payment so the drawer count and card settlement both reconcile.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosSplitTenderDto)
  splitPayments?: PosSplitTenderDto[];

  @ApiPropertyOptional({
    description:
      'Optional promo/coupon code to apply. Server validates and books the ' +
      'usage against the created order in the same transaction, so a code ' +
      'never counts against its usage limit for a sale that fails.',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

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
  /** GST for this product, from Product.taxPercentage. The till used to
   *  hardcode 5% because the scan never carried the real rate. */
  @ApiPropertyOptional() taxPercent?: number;
  /** List price, for the MRP line on a printed tag. */
  @ApiPropertyOptional() mrp?: number;
  /** Required on a GST invoice. */
  @ApiPropertyOptional() hsnCode?: string;
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
  @Type(() => Number)
  @IsNumber()
  scale?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  height?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  token?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  access_token?: string;
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
  @IsMoneyCustom()
  price!: number;

  @ApiPropertyOptional({
    description:
      'Maximum Retail Price, inclusive of taxes. Printed on the label for ' +
      'garments where MRP disclosure is required.',
  })
  @IsOptional()
  @IsMoneyCustom()
  mrp?: number;

  @ApiPropertyOptional({
    description:
      'HSN code for the item. Printed on the label so a return counter ' +
      'can look the product up without unpicking the SKU.',
  })
  @IsOptional()
  @IsHsnCodeCustom()
  hsnCode?: string;

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
  @IsMoneyCustom()
  openingCash!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ClosePosShiftDto {
  @ApiProperty({ description: 'Physical cash counted in the drawer at close' })
  @IsMoneyCustom()
  closingCashCounted!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * A counter exchange: the customer brings items back and takes different ones.
 *
 * Booked as two paired invoices -- a return credit note at the returned
 * item's value and a fresh tax invoice at the new item's value. The physical
 * cash movement is the difference; both invoices carry the correct GST so the
 * customer's tax history and the shop's ledger stay right.
 */
export class CreatePosExchangeDto {
  @ApiProperty({ description: 'Order number the returned items were originally sold under.' })
  @IsString()
  originalOrderNumber!: string;

  @ApiProperty({
    type: [PosReturnItemDto],
    description: 'Which lines of the original sale are coming back.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosReturnItemDto)
  returnItems!: PosReturnItemDto[];

  @ApiProperty({
    type: [PosCartItemDto],
    description: 'The items being sold as replacement, priced as a fresh sale.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosCartItemDto)
  newItems!: PosCartItemDto[];

  @ApiProperty({
    enum: PosRefundMethodType,
    description:
      'How the returned value is booked back to the customer. Only matters ' +
      'when the exchange leaves the shop owing the customer money.',
  })
  @IsEnum(PosRefundMethodType)
  refundMethod!: PosRefundMethodType;

  @ApiProperty({
    enum: PosPaymentMethodType,
    description:
      'How the new sale is paid. Only matters when the customer owes extra ' +
      'because the replacement costs more than the return.',
  })
  @IsEnum(PosPaymentMethodType)
  paymentMethod!: PosPaymentMethodType;

  @ApiProperty({ description: 'Why the exchange was made (size wrong, defect, etc).' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  terminalId?: string;

  @ApiPropertyOptional({ type: PosCustomerInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosCustomerInfoDto)
  customer?: PosCustomerInfoDto;
}

/** Money in or out of the drawer for something other than a sale. */
export class PosCashMovementDto {
  @ApiProperty({
    enum: ['IN', 'OUT'],
    description:
      'IN when notes are added to the drawer, OUT when they are taken out.',
  })
  @IsIn(['IN', 'OUT'])
  direction!: 'IN' | 'OUT';

  @ApiProperty({ description: 'Amount moved. Always positive.' })
  @IsMoneyCustom({ message: 'Cash movement amount must be zero or positive with at most 2 decimals' })
  amount!: number;

  @ApiProperty({
    description:
      'Why the money moved -- "paid delivery boy", "banked surplus". ' +
      'Required: an unexplained drawer movement is indistinguishable from theft.',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}

/**
 * Marks a receipt as a duplicate. The header prints "DUPLICATE COPY" so an
 * over-the-counter reprint can\'t be passed off as the original -- an audit
 * requirement on Indian GST invoices.
 */
export interface ReceiptReprintFlag {
  isReprint?: boolean;
}

export class ValidateCouponAtPosDto {
  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty({ type: [PosCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosCartItemDto)
  items!: PosCartItemDto[];

  @ApiPropertyOptional({ description: 'Order-level discount already applied.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountTotal?: number;
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

  @ApiPropertyOptional({
    description:
      'True when this is a re-issued receipt. The header stamps "DUPLICATE COPY" ' +
      'so a reprint can\'t be mistaken for the original tax invoice.',
  })
  @IsOptional()
  @IsBoolean()
  isReprint?: boolean;

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
    description:
      'Payment gateway transaction/reference ID, if this sale went through one (e.g. UPI/card). Omitted for cash sales.',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;
}
