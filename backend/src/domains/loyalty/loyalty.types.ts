import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUUID, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class EarnLoyaltyDto {
  @ApiProperty() @IsUUID() customerId!: string;
  @ApiProperty() @IsInt() @Min(1) points!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class RedeemLoyaltyDto {
  @ApiProperty() @IsInt() @Min(1) points!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() referenceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
}

export class AdminRedeemLoyaltyDto extends RedeemLoyaltyDto {
  @ApiProperty() @IsUUID() customerId!: string;
}

export class LoyaltyHistoryQueryDto {
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

export class LoyaltyBalanceResponse {
  @ApiProperty() customerId!: string;
  @ApiProperty() pointsBalance!: number;
  @ApiProperty() lifetimeEarned!: number;
  @ApiProperty() lifetimeRedeemed!: number;
  @ApiProperty() tier!: string;
  @ApiProperty() isActive!: boolean;
}

export class LoyaltyStatsResponse {
  @ApiProperty() totalPointsIssued!: number;
  @ApiProperty() totalPointsRedeemed!: number;
  @ApiProperty() activeMembers!: number;
  @ApiProperty({ type: [Object] }) tierBreakdown!: { tier: string; count: number }[];
}
