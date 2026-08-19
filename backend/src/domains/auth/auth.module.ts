import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PasswordService } from './services/password.service';
import { JwtService } from './services/jwt.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { FirebaseAdminService } from './services/firebase-admin.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    PasswordService,
    JwtService,
    RefreshTokenService,
    FirebaseAdminService,
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
    FirebaseAdminService,
  ],
})
export class AuthModule {}
