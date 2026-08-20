import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionExpirySettingsResponse {
  @ApiProperty({ description: 'Access token validity in minutes (normal login).' })
  accessTokenMinutes!: number;

  @ApiProperty({ description: 'Access token validity in days ("Remember me" login).' })
  rememberMeAccessTokenDays!: number;

  @ApiProperty({ description: 'Refresh token / session validity in days (normal login).' })
  refreshTokenDays!: number;

  @ApiProperty({ description: 'Refresh token / session validity in days ("Remember me" login).' })
  rememberMeRefreshTokenDays!: number;
}

export class UpdateSessionExpirySettingsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  accessTokenMinutes?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  rememberMeAccessTokenDays?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  refreshTokenDays?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  rememberMeRefreshTokenDays?: number;
}
