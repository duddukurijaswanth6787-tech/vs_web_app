import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, {
    message: 'Phone must be a valid 10-digit Indian mobile number',
  })
  phone!: string;

  @ApiPropertyOptional({
    enum: ['LOGIN', 'VERIFY_PHONE', 'REGISTER'],
    default: 'LOGIN',
  })
  @IsOptional()
  @IsIn(['LOGIN', 'VERIFY_PHONE', 'REGISTER'])
  purpose?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code!: string;

  @ApiPropertyOptional({
    enum: ['LOGIN', 'VERIFY_PHONE', 'REGISTER'],
    default: 'LOGIN',
  })
  @IsOptional()
  @IsIn(['LOGIN', 'VERIFY_PHONE', 'REGISTER'])
  purpose?: string;
}

export class OtpLoginDto {
  @ApiProperty({ example: '9876543210' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/)
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(4)
  @MaxLength(8)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class FirebasePhoneLoginDto {
  @ApiProperty({
    description:
      'Firebase ID token returned by confirmationResult.confirm(code) after Firebase verified the SMS OTP client-side.',
  })
  @IsString()
  idToken!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class SendOtpResponse {
  @ApiProperty() phone!: string;
  @ApiProperty() expiresInSeconds!: number;
  @ApiProperty() purpose!: string;
  @ApiPropertyOptional() devCode?: string;
}
