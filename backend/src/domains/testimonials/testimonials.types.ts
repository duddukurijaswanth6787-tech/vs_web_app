import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ description: 'Customer Name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ description: 'Customer Role or Title (e.g. Verified Buyer)' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({ description: 'Testimonial Comment' })
  @IsString()
  @IsNotEmpty()
  comment!: string;

  @ApiPropertyOptional({ description: 'Rating (1 to 5)', default: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Avatar Image URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Customer Location (e.g. Hyderabad, India)' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Feature on Homepage', default: true })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Display Sort Order', default: 0 })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;
}

export class UpdateTestimonialDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Status (ACTIVE / INACTIVE / ARCHIVED)' })
  @IsString()
  @IsOptional()
  status?: string;
}
