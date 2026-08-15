-- Add the fields the banner form already sends (mobileImageUrl was being
-- silently dropped by the service layer -- never persisted) plus new
-- admin controls for the hero CTA button: show/hide it, and pick between
-- a solid or transparent button style.
ALTER TABLE "banners"
  ADD COLUMN "mobileImageUrl" TEXT,
  ADD COLUMN "ctaEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "ctaStyle" TEXT NOT NULL DEFAULT 'solid';
