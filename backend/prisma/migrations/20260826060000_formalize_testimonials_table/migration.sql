-- The testimonials table was never given a migration. It only existed because
-- AutoSeedService.onModuleInit() ran an ad-hoc CREATE TABLE on every boot,
-- inside a try/catch that swallowed failures -- so nothing ever reported that
-- the table it created does not match the Prisma schema:
--
--   * it named the columns `title` and `content`; the schema calls them
--     `role` and `comment`
--   * it wrote the camelCase identifiers unquoted, so Postgres folded them to
--     avatarurl / isfeatured / displayorder / createdby / updatedby /
--     createdat / updatedat / deletedat, none of which Prisma's quoted
--     "avatarUrl" etc. can find
--
-- Every prisma.testimonial read therefore failed in production with
-- "The column `testimonials.role` does not exist in the current database" --
-- `role` being simply the first mismatch Prisma reached.
--
-- This migration reconciles the table to the schema, whichever state it is
-- in: absent (a database built from migrations alone), the broken runtime
-- shape, or already correct.

CREATE TABLE IF NOT EXISTS "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT DEFAULT 'Verified Buyer',
    "comment" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "avatarUrl" TEXT,
    "location" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- Rename only where the wrong name is present and the right one is not, so
-- this is safe to run against a table that is already correct.
DO $$
DECLARE
  rename_pairs TEXT[][] := ARRAY[
    ARRAY['title', 'role'],
    ARRAY['content', 'comment'],
    ARRAY['avatarurl', 'avatarUrl'],
    ARRAY['isfeatured', 'isFeatured'],
    ARRAY['displayorder', 'displayOrder'],
    ARRAY['createdby', 'createdBy'],
    ARRAY['updatedby', 'updatedBy'],
    ARRAY['createdat', 'createdAt'],
    ARRAY['updatedat', 'updatedAt'],
    ARRAY['deletedat', 'deletedAt']
  ];
  pair TEXT[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY rename_pairs LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'testimonials' AND column_name = pair[1]
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'testimonials' AND column_name = pair[2]
    ) THEN
      EXECUTE format(
        'ALTER TABLE "testimonials" RENAME COLUMN %I TO %I', pair[1], pair[2]
      );
    END IF;
  END LOOP;
END $$;

-- Backfill anything the older shape never had at all.
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'Verified Buyer';
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "comment" TEXT;
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "displayOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "testimonials" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- `comment` is NOT NULL in the schema. An existing row could only be null if
-- it predates the column, so give those a placeholder before enforcing it.
UPDATE "testimonials" SET "comment" = '' WHERE "comment" IS NULL;
ALTER TABLE "testimonials" ALTER COLUMN "comment" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "testimonials_isFeatured_idx" ON "testimonials"("isFeatured");
CREATE INDEX IF NOT EXISTS "testimonials_status_idx" ON "testimonials"("status");
CREATE INDEX IF NOT EXISTS "testimonials_displayOrder_idx" ON "testimonials"("displayOrder");
