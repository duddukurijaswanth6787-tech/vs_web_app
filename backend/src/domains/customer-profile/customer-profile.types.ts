import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProfileDto {
  @ApiProperty() @IsString() userId!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredLanguage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredCurrency?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBrands?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSizes?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredColors?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preferredPriceMin?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preferredPriceMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() profileImage?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;
  // Written to the User row, not the profile row -- see updateProfile, which
  // also guards uniqueness since login resolves an account by this.
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() gender?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() dateOfBirth?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredLanguage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredCurrency?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredBrands?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredSizes?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredColors?: string[];
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preferredPriceMin?: number;
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  preferredPriceMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() profileImage?: string;
}

export class ProfileResponse {
  @ApiProperty() id!: string;
  @ApiProperty() userId!: string;
  // Sourced from the related User row, not the profile row itself.
  @ApiPropertyOptional() firstName?: string;
  @ApiPropertyOptional() lastName?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() gender?: string;
  @ApiPropertyOptional() dateOfBirth?: Date;
  @ApiPropertyOptional() preferredLanguage?: string;
  @ApiPropertyOptional() preferredCurrency?: string;
  @ApiPropertyOptional() preferredCategories?: string[];
  @ApiPropertyOptional() preferredBrands?: string[];
  @ApiPropertyOptional() preferredSizes?: string[];
  @ApiPropertyOptional() preferredColors?: string[];
  @ApiPropertyOptional() preferredPriceMin?: number;
  @ApiPropertyOptional() preferredPriceMax?: number;
  @ApiPropertyOptional() profileImage?: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
