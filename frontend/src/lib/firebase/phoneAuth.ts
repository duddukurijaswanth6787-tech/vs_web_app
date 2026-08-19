import type { RecaptchaVerifier as RecaptchaVerifierType, ConfirmationResult } from 'firebase/auth';
import { getFirebaseAuth } from './config';

let recaptchaVerifier: RecaptchaVerifierType | null = null;

/**
 * Firebase Phone Auth requires a reCAPTCHA check before it will send an SMS.
 * `size: 'invisible'` keeps it out of the way unless Firebase decides a
 * visible challenge is needed. Must only be called client-side (uses
 * `window`/`document`), and the container element must already be mounted.
 */
async function getRecaptchaVerifier(containerId: string): Promise<RecaptchaVerifierType> {
  if (recaptchaVerifier) return recaptchaVerifier;
  const { RecaptchaVerifier } = await import('firebase/auth');
  const auth = await getFirebaseAuth();
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });
  return recaptchaVerifier;
}

/** Tears down the reCAPTCHA widget so a fresh one is created next time (e.g. after "Change number"). */
export function resetRecaptcha() {
  recaptchaVerifier?.clear();
  recaptchaVerifier = null;
}

/**
 * Kicks off Firebase phone login: solves the (invisible) reCAPTCHA and asks
 * Firebase to text a code to `phoneE164`. Returns a ConfirmationResult --
 * call `.confirm(code)` on it once the user types the code back in.
 */
export async function sendFirebasePhoneOtp(
  phoneE164: string,
  containerId: string,
): Promise<ConfirmationResult> {
  const [auth, verifier, { signInWithPhoneNumber }] = await Promise.all([
    getFirebaseAuth(),
    getRecaptchaVerifier(containerId),
    import('firebase/auth'),
  ]);
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}
