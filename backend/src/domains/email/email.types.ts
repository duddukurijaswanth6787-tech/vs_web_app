import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsUUID, IsBoolean, IsInt, Min, Max, IsArray } from 'class-validator';

export class EmailAttachmentDto {
  @ApiProperty()
  @IsString()
  filename!: string;

  @ApiProperty({ description: 'File content as string or base64' })
  @IsString()
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  encoding?: string;
}

export class SendEmailDto {
  @ApiProperty({ example: 'customer@example.com' })
  @IsEmail()
  to!: string;

  @ApiProperty({ example: 'ORDER_CONFIRMED' })
  @IsString()
  template!: string;

  @ApiProperty()
  @IsString()
  subject!: string;

  @ApiProperty()
  @IsString()
  html!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ type: [EmailAttachmentDto] })
  @IsOptional()
  @IsArray()
  attachments?: EmailAttachmentDto[];
}

export class UpdateEmailConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'AMAZON_SES' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: 'email-smtp.ap-south-1.amazonaws.com' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ example: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  smtpSecure?: boolean;

  @ApiPropertyOptional({ example: 'AKIAIOSFODNN7EXAMPLE' })
  @IsOptional()
  @IsString()
  smtpUser?: string;

  @ApiPropertyOptional({ example: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY' })
  @IsOptional()
  @IsString()
  smtpPassword?: string;

  @ApiPropertyOptional({ example: 'orders@vasanthissignature.in' })
  @IsOptional()
  @IsString()
  fromAddress?: string;

  @ApiPropertyOptional({ example: "Vasanthi's Signature" })
  @IsOptional()
  @IsString()
  fromName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableOrderConfirmation?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enableInvoicePdf?: boolean;
}

export class SendTestEmailDto {
  @ApiProperty({ example: 'admin@vasanthissignature.in' })
  @IsEmail()
  to!: string;
}

export interface EmailConfigResponse {
  enabled: boolean;
  provider: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  hasPassword: boolean;
  fromAddress: string;
  fromName: string;
  enableOrderConfirmation: boolean;
  enableInvoicePdf: boolean;
}

