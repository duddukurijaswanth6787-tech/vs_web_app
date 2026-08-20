import { Global, Module } from '@nestjs/common';
import { AppSettingRepository } from '@domains/app-setting/app-setting.repository';
import { AuthController } from './auth.controller';
import { SessionSettingsController } from './session-settings.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './services/password.service';
import { JwtService } from './services/jwt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { SessionSettingsService } from './services/session-settings.service';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { GoogleAuthService } from './services/google-auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  controllers: [AuthController, SessionSettingsController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    JwtService,
    RefreshTokenService,
    SessionSettingsService,
    AppSettingRepository,
    FirebaseAdminService,
    GoogleAuthService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    AuthService,
    AuthRepository,
    JwtAuthGuard,
    JwtService,
    RolesGuard,
    PermissionsGuard,
    PasswordService,
    RefreshTokenService,
    SessionSettingsService,
    FirebaseAdminService,
    GoogleAuthService,
  ],
})
export class AuthModule {}
