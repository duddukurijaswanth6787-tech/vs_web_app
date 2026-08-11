import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDtdcShipmentDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiPropertyOptional({ default: 'STANDARD' })
  @IsOptional()
  @IsString()
  serviceType?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  weightKg?: number;
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pieces?: number;
}

export class CancelDtdcShipmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
}
