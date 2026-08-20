import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { AuthenticationException, BusinessException } from '@common/exceptions';

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName?: string;
  avatar?: string;
}

/**
 * Verifies Google Sign-In ID tokens server-side. The frontend's "Continue
 * with Google" button hands us a signed JWT credential straight from
 * Google's own JS library -- this checks its signature against Google's
 * public keys and that it was issued for our own OAuth client (the `aud`
 * claim), so a client can't just POST an arbitrary email/name and log in as
 * anyone.
 */
@Injectable()
export class GoogleAuthService {
  private readonly logger = new Logger(GoogleAuthService.name);
  private client: OAuth2Client | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): OAuth2Client {
    if (this.client) return this.client;
    const clientId = this.configService.get<string>('app.google.clientId');
    if (!clientId) {
      throw new BusinessException(
        'Google login is not configured on the server. Set GOOGLE_CLIENT_ID.',
        'GOOGLE_000',
      );
    }
    this.client = new OAuth2Client(clientId);
    return this.client;
  }

  async verifyIdToken(credential: string): Promise<GoogleProfile> {
    const client = this.getClient();
    let payload: TokenPayload | undefined;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: this.configService.get<string>('app.google.clientId'),
      });
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
