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
    this.secret = this.configService.get<string>(
      'app.jwt.secret',
      'dev-secret',
    );
    this.issuer = this.configService.get<string>(
      'app.jwt.issuer',
      'vasanthi-designers',
    );
  }

  async sign(payload: JwtPayload, rememberMe = false): Promise<string> {
    return jwt.sign(payload, this.secret, {
      expiresIn: await this.getExpiresIn(rememberMe),
      issuer: this.issuer,
    });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret, {
      issuer: this.issuer,
    }) as JwtPayload;
  }

  /** Admin-configurable via SessionSettingsService, falling back to env-var defaults. */
  async getExpiresIn(rememberMe = false): Promise<number> {
    const settings = await this.sessionSettingsService.getSettings();
    return rememberMe
      ? settings.rememberMeAccessTokenDays * 86400
      : settings.accessTokenMinutes * 60;
  }
}
