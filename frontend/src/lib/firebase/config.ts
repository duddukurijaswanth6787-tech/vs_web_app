import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';

/**
 * Firebase config values are meant to be public (they identify the project
 * to Firebase, not authenticate as it) -- access is actually controlled by
 * Firebase Auth's authorized-domains list and, server-side, by verifying
 * the ID token with a service account. See src/lib/firebase/phoneAuth.ts
 * for the phone OTP flow that uses this.
 *
 * Initialization is lazy and browser-only, via dynamic import rather than a
 * static one: this page (login) is prerendered server-side at build time,
 * and eagerly importing+calling getAuth() at module scope used to run
 * during that prerender too -- with no NEXT_PUBLIC_FIREBASE_* vars
 * available in the build environment, Firebase threw `auth/invalid-
 * api-key` and failed the whole build. Nothing here is actually needed
 * until a real user clicks "Send OTP" in the browser, so it's deferred
 * until then instead.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export async function getFirebaseAuth(): Promise<Auth> {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is client-only; do not call getFirebaseAuth() during SSR.');
  }
  if (auth) return auth;

  const [{ initializeApp, getApps, getApp }, { getAuth }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  return auth;
}
