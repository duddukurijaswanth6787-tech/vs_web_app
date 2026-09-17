import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { SessionSettingsService } from './session-settings.service';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: string;
  roles: string[];
}

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly issuer: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly sessionSettingsService: SessionSettingsService,
  ) {
    const secret = this.configService.get<string>('app.jwt.secret');
    if (!secret) {
      // Joi's validation schema already requires JWT_SECRET in production,
      // so this should be unreachable there -- this is a last-resort guard
      // against ever signing/verifying a token with an empty secret.
      throw new Error('JWT_SECRET is not configured');
    }
    this.secret = secret;
    this.issuer = this.configService.get<string>(
      'app.jwt.issuer',
      'vasanthi-designers',
    );
  }

  async sign(payload: JwtPayload, rememberMe = false): Promise<string> {
    const expiresIn = await this.getExpiresIn(payload, rememberMe);
    return jwt.sign(payload, this.secret, {
      expiresIn,
      issuer: this.issuer,
    });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret, {
      issuer: this.issuer,
    }) as JwtPayload;
  }

  /** Admin-configurable via SessionSettingsService, falling back to env-var defaults. */
  async getExpiresIn(
    payloadOrRoles?: JwtPayload | string[] | boolean,
    rememberMe = false,
  ): Promise<number> {
    const settings = await this.sessionSettingsService.getSettings();

    let isRemember = rememberMe;
    let roles: string[] = [];
    let userType: string | undefined;

    if (typeof payloadOrRoles === 'boolean') {
      isRemember = payloadOrRoles;
    } else if (Array.isArray(payloadOrRoles)) {
      roles = payloadOrRoles;
    } else if (payloadOrRoles && typeof payloadOrRoles === 'object') {
      roles = payloadOrRoles.roles || [];
      userType = payloadOrRoles.userType;
    }

    const isAdminOrStaff =
      roles.some((r) =>
        ['super_admin', 'admin', 'staff', 'pos_operator', 'pos_staff'].includes(
          (r || '').toLowerCase(),
        ),
      ) ||
      userType === 'ADMIN' ||
      userType === 'SUPER_ADMIN' ||
      userType === 'STAFF';

    if (isAdminOrStaff) {
      const hours =
        settings.adminSessionHours && settings.adminSessionHours > 0
          ? settings.adminSessionHours
          : 24;
      return hours * 3600;
    }

    return isRemember
      ? (settings.rememberMeAccessTokenDays || 30) * 86400
      : (settings.accessTokenMinutes || 60) * 60;
  }
}
