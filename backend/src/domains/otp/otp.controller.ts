import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { OtpService } from './otp.service';
import {
  SendOtpDto,
  VerifyOtpDto,
  OtpLoginDto,
  FirebasePhoneLoginDto,
  OtpAdminLogsQueryDto,
} from './otp.types';
import { ResponseBuilder } from '@common/responses/response.builder';
import { setRefreshTokenCookie } from '@domains/auth/auth-cookie.util';
import {
  ThrottleOtpSend,
  ThrottleOtpVerify,
  ThrottleCredentials,
} from '@common/security/throttle.decorators';
import { JwtAuthGuard } from '@domains/auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@domains/auth/guards/roles.guard';

@ApiTags('OTP Auth')
@Controller('auth/otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @ThrottleOtpSend()
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number' })
  async send(@Body() dto: SendOtpDto, @Req() req: Request) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string)?.split(',')[0];
    const userAgent = req.headers['user-agent'] as string;
    return ResponseBuilder.success(
      await this.otpService.sendOtp(dto, ip, userAgent),
      'OTP sent',
    );
  }

  @Get('admin-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'staff')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get OTP challenges and lead drop-off logs for admin' })
  async getAdminLogs(@Query() query: OtpAdminLogsQueryDto) {
    return ResponseBuilder.success(
      await this.otpService.getAdminOtpLogs(query),
      'OTP logs fetched',
    );
  }

  @ThrottleOtpVerify()
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  async verify(@Body() dto: VerifyOtpDto) {
    return ResponseBuilder.success(
      await this.otpService.verifyOtp(dto),
      'OTP verified',
    );
  }

  @ThrottleCredentials()
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
    return ResponseBuilder.success(result, 'OTP login successful');
  }

  @ThrottleCredentials()
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
    return ResponseBuilder.success(result, 'OTP login successful');
  }
}
