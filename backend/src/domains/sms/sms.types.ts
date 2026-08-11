import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, Matches } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phone!: string;

  @ApiProperty({ example: 'ORDER_CONFIRMED' })
  @IsString()
  template!: string;

  @ApiProperty()
  @IsString()
  message!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class SendOrderSmsDto {
  @ApiProperty() @IsUUID() orderId!: string;
  @ApiPropertyOptional({
    enum: ['ORDER_CONFIRMED', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'OTP'],
  })
  @IsOptional()
  @IsString()
  template?: string;
}
