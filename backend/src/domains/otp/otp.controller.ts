import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { OtpService } from './otp.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  OtpLoginDto,
  FirebasePhoneLoginDto,
} from './otp.types';
import { ResponseBuilder } from '@common/responses/response.builder';
import { setRefreshTokenCookie, withoutRefreshToken } from '@domains/auth/auth-cookie.util';

@ApiTags('OTP Auth')
@Controller('auth/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  async send(@Body() dto: SendOtpDto) {
    return ResponseBuilder.success(
      await this.otpService.sendOtp(dto),
      'OTP sent',
    );
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  async verify(@Body() dto: VerifyOtpDto) {
    return ResponseBuilder.success(
      await this.otpService.verifyOtp(dto),
      'OTP verified',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login or register with OTP' })
  async login(
    @Body() dto: OtpLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.otpService.loginWithOtp(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    setRefreshTokenCookie(res, result.refreshToken);
    return ResponseBuilder.success(withoutRefreshToken(result), 'OTP login successful');
  }

  @Post('firebase-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Login or register with a phone number verified via Firebase Phone Auth (client already confirmed the SMS code with Firebase)',
  })
  async firebaseLogin(
    @Body() dto: FirebasePhoneLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.otpService.loginWithFirebasePhone(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    setRefreshTokenCookie(res, result.refreshToken);
    return ResponseBuilder.success(withoutRefreshToken(result), 'OTP login successful');
  }
}
