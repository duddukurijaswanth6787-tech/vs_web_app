import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum QuotationStatusType {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  CONVERTED = 'CONVERTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export class QuotationItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(300)
  productName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  variantTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sku?: string;

  @ApiProperty({ minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ description: 'Bulk discount for this line, percent' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'GST for this line, percent' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  taxPercent?: number;
}

export class CreateQuotationDto {
  @ApiPropertyOptional({
    description: 'Existing customer, when they have an account',
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ description: 'Name the quote is addressed to' })
  @IsString()
  @MaxLength(200)
  customerName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ type: [QuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items!: QuotationItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms printed on the quote' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  termsText?: string;

  @ApiPropertyOptional({
    description: 'Date the quoted prices stop being honoured',
  })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @ApiPropertyOptional({ enum: QuotationStatusType })
  @IsOptional()
  @IsEnum(QuotationStatusType)
  status?: QuotationStatusType;
}

export class UpdateQuotationDto extends CreateQuotationDto {
  @ApiPropertyOptional({ type: [QuotationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  declare items: QuotationItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  declare customerName: string;
}

export class ConvertQuotationDto {
  @ApiProperty({ description: 'How the customer paid at the till' })
  @IsString()
  paymentMethod!: string;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amountPaid!: number;

  @ApiPropertyOptional({ description: 'Register the sale is billed against' })
  @IsOptional()
  @IsString()
  terminalId?: string;
}
