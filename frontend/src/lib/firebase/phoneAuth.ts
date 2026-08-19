import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { firebaseAuth } from './config';

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Firebase Phone Auth requires a reCAPTCHA check before it will send an SMS.
 * `size: 'invisible'` keeps it out of the way unless Firebase decides a
 * visible challenge is needed. Must only be called client-side (uses
 * `window`/`document`), and the container element must already be mounted.
 */
function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
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
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(firebaseAuth, phoneE164, verifier);
}
