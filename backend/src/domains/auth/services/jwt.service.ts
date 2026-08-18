import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '@database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  userType: string;
  roles: string[];
}

// Keys in the generic app_settings table (Admin > Settings) a super admin can
// use to change session length without a redeploy. Deliberately avoid the
// words "token"/"secret"/"key" in these keys -- the admin Settings page
// write-protects any setting whose key contains those, to stop someone from
// accidentally editing a real secret through the generic settings UI.
const SESSION_EXPIRY_MINUTES_KEY = 'security.sessionExpiryMinutes';
const REMEMBER_ME_EXPIRY_DAYS_KEY = 'security.rememberMeExpiryDays';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly defaultExpiresIn: number;
  private readonly defaultRememberMeExpiresIn: number;
  private readonly issuer: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.secret = this.configService.get<string>(
      'app.jwt.secret',
      'dev-secret',
    );
    this.defaultExpiresIn = this.configService.get<number>(
      'app.jwt.expiresIn',
      900,
    );
    this.defaultRememberMeExpiresIn = this.configService.get<number>(
      'app.jwt.rememberMeExpiresIn',
      2592000,
    );
    this.issuer = this.configService.get<string>(
      'app.jwt.issuer',
      'vasanthi-designers',
    );
  }

  /**
   * Session length is admin-configurable (Admin > Settings, group "security")
   * so it can change without redeploying. Falls back to the env-configured
   * default when the setting is missing or holds an invalid value. Only
   * affects tokens issued from this point on -- a JWT's expiry is baked in
   * at signing time, so changing this setting cannot shorten or extend a
   * token that was already handed out.
   */
  private async resolveExpiresIn(rememberMe: boolean): Promise<number> {
    const key = rememberMe
      ? REMEMBER_ME_EXPIRY_DAYS_KEY
      : SESSION_EXPIRY_MINUTES_KEY;
    const fallback = rememberMe
      ? this.defaultRememberMeExpiresIn
      : this.defaultExpiresIn;
    try {
      const setting = await this.prisma.appSetting.findUnique({
        where: { key },
      });
      const raw = setting ? Number(setting.value) : NaN;
      if (!Number.isFinite(raw) || raw <= 0) return fallback;
      return rememberMe ? raw * 86400 : raw * 60;
    } catch {
      return fallback;
    }
  }

  async sign(payload: JwtPayload, rememberMe = false): Promise<string> {
    const expiresIn = await this.resolveExpiresIn(rememberMe);
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

  async getExpiresIn(rememberMe = false): Promise<number> {
    return this.resolveExpiresIn(rememberMe);
  }
}
