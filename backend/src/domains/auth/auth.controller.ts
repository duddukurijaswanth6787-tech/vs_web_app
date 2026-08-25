import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  ChangePasswordDto,
  GoogleLoginDto,
  AuthTokensResponse,
} from './auth.types';
import { JwtAuthGuard, CurrentUser } from './guards/jwt-auth.guard';
import type { JwtPayload } from './services/jwt.service';
import { ResponseBuilder } from '@common/responses/response.builder';
import {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from './auth-cookie.util';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthService: GoogleAuthService,
  ) {}

  @Post('seed-admin')
  @Get('seed-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed or reset initial admin credentials' })
  async seedAdmin() {
    const result = await this.authService.seedAdmin();
    return ResponseBuilder.success(result, 'Admin user seeded successfully');
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    setRefreshTokenCookie(res, result.refreshToken);
    return ResponseBuilder.created(result, 'Registration successful');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and return tokens' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    setRefreshTokenCookie(res, result.refreshToken);
    return ResponseBuilder.success(result, 'Login successful');
  }

  @Get('google/client-id')
  @ApiOperation({
    summary: 'Get the Google OAuth Client ID (public, no secret) for the frontend Sign-In button',
  })
  async googleClientId() {
    const clientId = await this.googleAuthService.getEffectiveClientId();
    return ResponseBuilder.success({ clientId });
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authenticate or register customer with Google Sign-In',
  })
  async googleAuth(
    @Body() dto: GoogleLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleLogin(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    setRefreshTokenCookie(res, result.refreshToken);
    return ResponseBuilder.success(result, 'Google login successful');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke refresh token' })
  async logout(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = dto.refreshToken || req.cookies?.[REFRESH_TOKEN_COOKIE];
    if (token) await this.authService.logout(token);
    clearRefreshTokenCookie(res);
    return ResponseBuilder.success(null, 'Logout successful');
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE] || dto.refreshToken;
    const result = token
      ? await this.authService.refresh(token, req.ip, req.headers['user-agent'])
      : null;
    if (!result) {
      clearRefreshTokenCookie(res);
      return ResponseBuilder.success(
        null as unknown as AuthTokensResponse,
        'Invalid or expired refresh token',
      );
    }
    setRefreshTokenCookie(res, result.refreshToken);
    return ResponseBuilder.success(result, 'Token refreshed');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async me(@CurrentUser() user: JwtPayload) {
    const result = await this.authService.me(user.sub);
    return ResponseBuilder.success(result, 'User profile retrieved');
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.sub, dto);
    return ResponseBuilder.success(null, 'Password changed successfully');
  }

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify JWT token validity' })
  async verifyToken(@Body() body: { token: string }) {
    try {
      this.authService.verifyToken(body.token);
      return ResponseBuilder.success({ valid: true }, 'Token is valid');
    } catch {
      return ResponseBuilder.success({ valid: false }, 'Token is invalid');
    }
  }
}
