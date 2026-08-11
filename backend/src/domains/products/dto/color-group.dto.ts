import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateColorGroupDto {
  @ApiProperty({
    description: 'ID of the AttributeOption from the Color Attribute Registry',
  })
  @IsUUID()
  colorAttributeOptionId!: string;

  @ApiPropertyOptional({
    description: 'Custom display label override for this color group',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateColorGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SyncColorGroupItemDto {
  @ApiPropertyOptional({
    description:
      'Existing DB ProductColorGroup ID (omit or legacy-fallback-* for new)',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsUUID()
  colorAttributeOptionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  variantIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  mediaIds?: string[];
}

export class SyncColorGroupsDto {
  @ApiProperty({ type: [SyncColorGroupItemDto] })
  colorGroups!: SyncColorGroupItemDto[];
}
