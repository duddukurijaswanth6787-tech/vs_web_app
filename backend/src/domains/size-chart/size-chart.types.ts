import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SizeChartRowDto {
  @ApiProperty({ description: 'Size label, e.g. M' })
  @IsString()
  size!: string;

  @ApiProperty({
    description: 'Measurement name to value, e.g. { "Bust": 38, "Waist": 34 }',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  measurements!: Record<string, number | string>;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

export class CreateSizeChartTemplateDto {
  @ApiProperty() @IsString() name!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ description: 'Kurta, Saree Blouse, Lehenga …' })
  @IsOptional()
  @IsString()
  garmentType?: string;

  @ApiPropertyOptional({ default: 'inch' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional({ type: [SizeChartRowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeChartRowDto)
  rows?: SizeChartRowDto[];
}

export class UpdateSizeChartTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() garmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unit?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;

  @ApiPropertyOptional({
    type: [SizeChartRowDto],
    description: 'When present, replaces every row on the template.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeChartRowDto)
  rows?: SizeChartRowDto[];
}

export class SizeChartQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() garmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() status?: string;

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
  limit?: number;
}

export class SizeChartRowResponse {
  @ApiProperty() id!: string;
  @ApiProperty() size!: string;
  @ApiProperty({ type: 'object', additionalProperties: true })
  measurements!: Record<string, number | string>;
  @ApiProperty() displayOrder!: number;
}

export class SizeChartTemplateResponse {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() garmentType?: string;
  @ApiProperty() unit!: string;
  @ApiProperty() status!: string;
  @ApiProperty({ type: [SizeChartRowResponse] }) rows!: SizeChartRowResponse[];
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
