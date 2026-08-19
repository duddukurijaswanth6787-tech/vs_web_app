import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { App } from 'firebase-admin/app';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { AuthenticationException, BusinessException } from '@common/exceptions';

/**
 * Verifies Firebase phone-auth ID tokens server-side. Firebase itself
 * delivers the SMS and checks the code the user typed; this service's job is
 * to confirm the ID token the frontend hands us was really signed by Firebase
 * for our project (not just any client-supplied phone number), so the
 * verified `phone_number` claim can be trusted for login/account lookup.
 *
 * The `firebase-admin` submodules are loaded via dynamic import rather than a
 * static one so that requiring this file (e.g. importing OtpService in a
 * test that mocks this service out) doesn't eagerly pull in firebase-admin's
 * dependency chain -- some of it (jose, via jwks-rsa) ships ESM-only and
 * breaks Jest's default CJS module loading purely by being required, even
 * when never called.
 */
@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: App | null = null;

  constructor(private readonly configService: ConfigService) {}

  private async getApp(): Promise<App> {
    if (this.app) return this.app;
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');

    const existing = getApps();
    if (existing.length) {
      this.app = existing[0];
      return this.app;
    }

    const projectId = this.configService.get<string>('app.firebase.projectId');
    const clientEmail = this.configService.get<string>('app.firebase.clientEmail');
    const privateKey = this.configService.get<string>('app.firebase.privateKey');

    if (!projectId || !clientEmail || !privateKey) {
      throw new BusinessException(
        'Firebase phone login is not configured on the server. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
        'FIREBASE_000',
      );
    }

    this.app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    return this.app;
  }

  /** Verifies a Firebase ID token and returns the caller's Firebase uid + verified phone number. */
  async verifyPhoneIdToken(idToken: string): Promise<{ uid: string; phone: string }> {
    let decoded: DecodedIdToken;
    try {
      const { getAuth } = await import('firebase-admin/auth');
      decoded = await getAuth(await this.getApp()).verifyIdToken(idToken);
    } catch (err) {
      if (err instanceof BusinessException) throw err;
      this.logger.warn(`Firebase ID token verification failed: ${(err as Error).message}`);
      throw new AuthenticationException('Invalid or expired Firebase ID token', 'FIREBASE_001');
    }

    const phoneNumber = decoded.phone_number as string | undefined;
    if (!phoneNumber) {
      throw new AuthenticationException(
        'This Firebase token has no verified phone number on it',
        'FIREBASE_002',
      );
    }

    return { uid: decoded.uid, phone: phoneNumber };
  }
}
