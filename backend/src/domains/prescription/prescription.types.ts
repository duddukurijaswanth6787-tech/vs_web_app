import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadPrescriptionDto {
  @ApiProperty() @IsUrl() imageUrl!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() doctorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hospitalName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  prescriptionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdatePrescriptionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() doctorName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hospitalName?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  prescriptionDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiryDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class VerifyPrescriptionDto {
  @ApiProperty() @IsString() verificationStatus!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class PrescriptionQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() verificationStatus?: string;
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

export class PrescriptionMedicineResponse {
  @ApiProperty() id!: string;
  @ApiProperty() medicineName!: string;
  @ApiPropertyOptional() dosage?: string;
  @ApiPropertyOptional() frequency?: string;
  @ApiPropertyOptional() duration?: string;
  @ApiPropertyOptional() quantity?: number;
  @ApiPropertyOptional() instructions?: string;
  @ApiPropertyOptional() confidence?: number;
  @ApiPropertyOptional() productId?: string;
}

export class PrescriptionResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  @ApiProperty() imageUrl!: string;
  @ApiPropertyOptional() doctorName?: string;
  @ApiPropertyOptional() hospitalName?: string;
  @ApiPropertyOptional() prescriptionDate?: Date;
  @ApiPropertyOptional() expiryDate?: Date;
  @ApiPropertyOptional() ocrConfidence?: number;
  @ApiProperty() verificationStatus!: string;
  @ApiProperty({ type: [PrescriptionMedicineResponse] })
  medicines?: PrescriptionMedicineResponse[];
  @ApiPropertyOptional() notes?: string;
  @ApiProperty() createdAt!: Date;
}

export class PrescriptionListResponse {
  @ApiProperty({ type: [PrescriptionResponse] }) data!: PrescriptionResponse[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
