import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEmail,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateWebsiteSettingDto {
  @ApiPropertyOptional() @IsOptional() @IsString() storeName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storeDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() favicon?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supportEmail?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supportPhone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() whatsappNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() supportHours?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() timezone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() language?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() copyrightText?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() metaTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaKeywords?: string;
}

export class UpdateHomepageSectionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;
}

export class CreateHomepageCategoryDto {
  @ApiProperty() @IsString() categoryId!: string;
}

export class ReorderDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  order!: string[];
}

export class UpdateSocialLinkDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;
}

export class CreateFooterLinkDto {
  @ApiProperty() @IsString() footerSectionId!: string;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() url!: string;
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class UpdateFooterLinkDto {
  @ApiPropertyOptional() @IsOptional() @IsString() title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() url?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() openInNewTab?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() enabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() displayOrder?: number;
}

export class UpdateFeatureToggleDto {
  @ApiProperty() @IsBoolean() enabled!: boolean;
}

export class BulkFeatureToggleDto {
  @ApiProperty({
    type: [String],
    description: 'Array of feature keys to enable',
  })
  @IsArray()
  @IsString({ each: true })
  enable!: string[];

  @ApiProperty({
    type: [String],
    description: 'Array of feature keys to disable',
  })
  @IsArray()
  @IsString({ each: true })
  disable!: string[];
}

export class NewsletterSubscribeDto {
  @ApiProperty({ example: 'user@example.com' }) @IsEmail() email!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
}

export class NewsletterQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
  @ApiPropertyOptional({ enum: ['SUBSCRIBED', 'UNSUBSCRIBED', 'PENDING'] })
  @IsOptional()
  @IsString()
  status?: string;
}
