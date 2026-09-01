-- Cashier's short PIN (argon2-hashed) for quick till switching without a full login.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "posPinHash" TEXT;
