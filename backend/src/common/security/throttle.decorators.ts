import { Throttle } from '@nestjs/throttler';

/**
 * Named rate limits for the endpoints where a request is an *attempt* at
 * something, rather than a customer reading a page.
 *
 * The global limit has to be generous: one storefront page load fans out to a
 * dozen API calls, so a limit tight enough to slow down credential guessing
 * would throttle people browsing the shop. A single shared bucket forces a
 * choice between those two, and the safe-looking answer (tighten it) is the
 * one that takes the shop down.
 *
 * So browsing keeps the generous global limit, and the endpoints that guess,
 * send, or spend get their own strict ones here.
 */

const minutes = (n: number) => n * 60 * 1000;

/**
 * Credential guessing: login, password reset, token verification.
 *
 * Per-account lockout already exists (auth.service counts loginAttempts and
 * sets lockoutUntil), but it only protects an account someone is hammering.
 * It does nothing against one attacker trying one password across many
 * accounts, which never trips any single account's counter -- that is what
 * this per-IP limit is for.
 */
export const ThrottleCredentials = () =>
  Throttle({ default: { limit: 10, ttl: minutes(15) } });

/**
 * Sending a one-time code costs money and reaches a real person's phone.
 * Unlimited sends are an SMS bill and a way to harass a number.
 */
export const ThrottleOtpSend = () =>
  Throttle({ default: { limit: 5, ttl: minutes(15) } });

/**
 * Guessing a one-time code. The per-challenge attempt counter in otp.service
 * caps guesses against a single code; this caps an attacker requesting fresh
 * codes and guessing each a few times.
 */
export const ThrottleOtpVerify = () =>
  Throttle({ default: { limit: 15, ttl: minutes(15) } });

/**
 * Account creation, so one source cannot mint accounts in bulk.
 */
export const ThrottleSignup = () =>
  Throttle({ default: { limit: 5, ttl: minutes(60) } });
