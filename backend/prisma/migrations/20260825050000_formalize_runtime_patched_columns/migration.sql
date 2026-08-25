-- users.facebookId/appleId and products.warrantyInfo/careInstructions were
-- never given a real migration -- they only existed live because
-- AutoSeedService.onModuleInit() ran ad-hoc `ADD COLUMN IF NOT EXISTS`
-- statements on every boot. That's fragile (silently depends on that
-- runtime hack staying in place and running before any request lands) and
-- non-standard, so formalize them as a real migration now that they're
-- known-safe (columns already exist in production).
--
-- staff_profiles.profileImage is different: it was missing a migration AND
-- had no runtime patch, so it was a genuinely live gap -- any full-row read
-- of StaffProfile (staff directory, staff detail pages) was throwing.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "facebookId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appleId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_facebookId_key" ON "users"("facebookId");
CREATE UNIQUE INDEX IF NOT EXISTS "users_appleId_key" ON "users"("appleId");

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "warrantyInfo" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "careInstructions" TEXT;

ALTER TABLE "staff_profiles" ADD COLUMN IF NOT EXISTS "profileImage" TEXT;
