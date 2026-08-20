import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export const OTP_GATEWAY_PROVIDERS = ['mock', 'startmessaging'] as const;
export type OtpGatewayProvider = (typeof OTP_GATEWAY_PROVIDERS)[number];

export interface OtpTemplateOption {
  id: string;
  body: string;
  usesAppName: boolean;
  usesExpiry: boolean;
}

/**
 * The active StartMessaging templates for this account (from its dashboard's
 * Templates Reference). StartMessaging's API has no "list templates"
 * endpoint, so these are the fixed set the admin picks from in the UI
 * instead of pasting a raw template ID by hand.
 */
export const STARTMESSAGING_TEMPLATES: OtpTemplateOption[] = [
  {
    id: '0afbdeb0-785d-4dd0-bd48-365a182df276',
    body: 'Your OTP is {{otp}}. Do not share this code with anyone. Powered by Start Messaging.',
    usesAppName: false,
    usesExpiry: false,
  },
  {
    id: '39beb731-de09-4a1d-bbbf-3cc9a12936f9',
    body: 'Your {{appName}} OTP is {{otp}}. Do not share this code with anyone. Powered by Start Messaging.',
    usesAppName: true,
    usesExpiry: false,
  },
  {
    id: '6990f1b1-6a28-4cb4-a8ed-35a450a6b59d',
    body: 'Your {{appName}} OTP is {{otp}}, valid for {{expiry}} minutes. Do not share this code with anyone. Powered by Start Messaging.',
    usesAppName: true,
    usesExpiry: true,
  },
  {
    id: '3465e087-ff91-4e9a-a33c-e571ec5fae45',
    body: 'Your OTP is {{otp}}, valid for {{expiry}} minutes. Do not share this code with anyone. Powered by Start Messaging.',
    usesAppName: false,
    usesExpiry: true,
  },
];

export class OtpGatewayConfigResponse {
  @ApiProperty({ enum: OTP_GATEWAY_PROVIDERS }) provider!: OtpGatewayProvider;
  @ApiProperty() appName!: string;
  @ApiProperty() templateLogin!: string;
  @ApiProperty() templateRegister!: string;
  @ApiProperty() templateVerifyPhone!: string;
  @ApiProperty({ description: 'OTP validity window in minutes, also substituted into {{expiry}} in templates.' })
  expiryMinutes!: number;
  @ApiProperty({
    description: 'Whether STARTMESSAGING_API_KEY is set on the server (never returns the key itself).',
  })
  apiKeyConfigured!: boolean;
}

export class UpdateOtpGatewayConfigDto {
  @ApiPropertyOptional({ enum: OTP_GATEWAY_PROVIDERS })
  @IsOptional()
  @IsIn(OTP_GATEWAY_PROVIDERS)
  provider?: OtpGatewayProvider;

  @ApiPropertyOptional() @IsOptional() @IsString() appName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() templateLogin?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() templateRegister?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() templateVerifyPhone?: string;

  @ApiPropertyOptional({ description: 'OTP validity window in minutes (also used as {{expiry}} in templates).' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiryMinutes?: number;

  @ApiPropertyOptional({
    description:
      'StartMessaging API key. Write-only -- never returned by GET /config. Omit to leave the current key (DB-stored or env var) unchanged.',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;
}
