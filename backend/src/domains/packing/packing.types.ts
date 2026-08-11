import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackingJobDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assignedTo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class VerifyBarcodeDto {
  @ApiProperty() @IsString() barcode!: string;
}

export class PackingQueueQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsIn([
    'QUEUED',
    'ASSIGNED',
    'PACKING',
    'VERIFIED',
    'LABELLED',
    'COMPLETED',
    'CANCELLED',
  ])
  status?: string;
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

export class AssignPackingDto {
  @ApiProperty() @IsString() assignedTo!: string;
}
