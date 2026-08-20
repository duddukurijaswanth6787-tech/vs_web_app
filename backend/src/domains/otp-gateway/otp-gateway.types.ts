import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const OTP_GATEWAY_PROVIDERS = ['mock', 'startmessaging'] as const;
export type OtpGatewayProvider = (typeof OTP_GATEWAY_PROVIDERS)[number];

export class OtpGatewayConfigResponse {
  @ApiProperty({ enum: OTP_GATEWAY_PROVIDERS }) provider!: OtpGatewayProvider;
  @ApiProperty() appName!: string;
  @ApiProperty() templateLogin!: string;
  @ApiProperty() templateRegister!: string;
  @ApiProperty() templateVerifyPhone!: string;
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

  @ApiPropertyOptional({
    description:
      'StartMessaging API key. Write-only -- never returned by GET /config. Omit to leave the current key (DB-stored or env var) unchanged.',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;
}
