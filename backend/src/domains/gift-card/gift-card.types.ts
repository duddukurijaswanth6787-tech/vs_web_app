import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsEmail,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGiftCardDto {
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(1) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsEmail() recipientEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() code?: string;
}

export class PurchaseGiftCardDto {
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(1) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsEmail() recipientEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recipientPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() message?: string;
}

export class RedeemGiftCardDto {
  @ApiProperty() @IsString() code!: string;
  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0.01) amount!: number;
  @ApiPropertyOptional() @IsOptional() @IsUUID() orderId?: string;
}

export class GiftCardBalanceDto {
  @ApiProperty() @IsString() code!: string;
}
