import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { AuthenticationException, BusinessException } from '@common/exceptions';
import { AppSettingRepository } from '@domains/app-setting/app-setting.repository';

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName?: string;
  avatar?: string;
}

const GROUP = 'google_auth';
const CLIENT_ID_KEY = 'google_auth.client_id';

/**
 * Verifies Google Sign-In ID tokens server-side. The frontend's "Continue
 * with Google" button hands us a signed JWT credential straight from
 * Google's own JS library -- this checks its signature against Google's
 * public keys and that it was issued for our own OAuth client (the `aud`
 * claim), so a client can't just POST an arbitrary email/name and log in as
 * anyone.
 *
 * The OAuth Client ID itself is admin-configurable (Admin > Access > Login
 * Sessions) the same way the StartMessaging API key is -- a DB-stored value
 * takes priority over the GOOGLE_CLIENT_ID env var, so it can be set/changed
 * without a redeploy. It's not a secret (it's normally embedded straight
 * into frontend JS), so unlike the StartMessaging key it's returned as-is by
 * getConfig(), and also exposed publicly via GET /auth/google/client-id so
 * the (pre-login) login page can fetch it at runtime instead of needing a
 * frontend rebuild every time it changes.
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly settingRepository: AppSettingRepository,
  ) {}

  async getEffectiveClientId(): Promise<string> {
    const dbValue = await this.settingRepository.getByKey(CLIENT_ID_KEY);
    return dbValue || this.configService.get<string>('app.google.clientId', '');
  }

  async updateClientId(clientId: string): Promise<{ clientId: string }> {
    const existing = await this.settingRepository.findByKey(CLIENT_ID_KEY);
    if (existing) {
      await this.settingRepository.update(existing.id, { value: clientId });
    } else {
      await this.settingRepository.create({
        key: CLIENT_ID_KEY,
        value: clientId,
        group: GROUP,
        description: 'Google OAuth Web Client ID (Google Cloud Console > Google Auth Platform > Clients)',
      });
    }
    return { clientId: await this.getEffectiveClientId() };
  }

  async verifyIdToken(credential: string): Promise<GoogleProfile> {
    const clientId = await this.getEffectiveClientId();
    if (!clientId) {
      throw new BusinessException(
        'Google login is not configured on the server. Set a Client ID via Admin > Access > Login Sessions, or the GOOGLE_CLIENT_ID env var.',
        'GOOGLE_000',
      );
    }
    const client = new OAuth2Client(clientId);

    let payload: TokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      payload = ticket.getPayload();
    } catch (err) {
      this.logger.warn(`Google ID token verification failed: ${(err as Error).message}`);
      throw new AuthenticationException('Invalid or expired Google credential', 'GOOGLE_001');
    }

    if (!payload?.sub || !payload.email) {
      throw new AuthenticationException(
        'This Google credential has no verified account on it',
        'GOOGLE_002',
      );
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified ?? false,
      firstName: payload.given_name || payload.name || 'Customer',
      lastName: payload.family_name || undefined,
      avatar: payload.picture || undefined,
    };
  }
}
