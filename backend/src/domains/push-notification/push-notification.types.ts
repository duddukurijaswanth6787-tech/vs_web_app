import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsIn, IsObject } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty() @IsString() token!: string;
  @ApiPropertyOptional({ enum: ['WEB', 'ANDROID', 'IOS'], default: 'WEB' })
  @IsOptional()
  @IsIn(['WEB', 'ANDROID', 'IOS'])
  platform?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() deviceName?: string;
}

export class SendPushDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() userId?: string;
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() data?: Record<string, any>;
}
