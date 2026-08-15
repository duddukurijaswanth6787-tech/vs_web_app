-- Data repair: AWS_S3_PUBLIC_URL was misconfigured on the production backend
-- (left pointing at "http://localhost:4000/api/v1/storage", a dev-only value,
-- instead of the real backend origin) for some period. Uploads themselves
-- went to the correct S3 bucket/key the whole time -- only the *recorded*
-- public URL for each file was wrong, making every affected image
-- unreachable to real visitors. This is a pure string substitution on the
-- stored URL text; no storage keys or file bytes are touched.
--
-- Safe to no-op: the WHERE clauses only match rows that still contain the
-- broken prefix, so this is a no-op once applied (or if nothing was ever
-- affected).

UPDATE "media" SET
  "publicUrl" = replace("publicUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "thumbnailUrl" = replace("thumbnailUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "mediumUrl" = replace("mediumUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "largeUrl" = replace("largeUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage')
WHERE "publicUrl" LIKE 'http://localhost:4000%'
   OR "thumbnailUrl" LIKE 'http://localhost:4000%'
   OR "mediumUrl" LIKE 'http://localhost:4000%'
   OR "largeUrl" LIKE 'http://localhost:4000%';

UPDATE "product_media" SET
  "url" = replace("url", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "thumbnailUrl" = replace("thumbnailUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage')
WHERE "url" LIKE 'http://localhost:4000%'
   OR "thumbnailUrl" LIKE 'http://localhost:4000%';

UPDATE "banners" SET
  "imageUrl" = replace("imageUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage')
WHERE "imageUrl" LIKE 'http://localhost:4000%';

UPDATE "categories" SET
  "icon" = replace("icon", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "image" = replace("image", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "bannerImage" = replace("bannerImage", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage')
WHERE "icon" LIKE 'http://localhost:4000%'
   OR "image" LIKE 'http://localhost:4000%'
   OR "bannerImage" LIKE 'http://localhost:4000%';

UPDATE "social_post_media" SET
  "url" = replace("url", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "thumbnailUrl" = replace("thumbnailUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "mediumUrl" = replace("mediumUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage'),
  "largeUrl" = replace("largeUrl", 'http://localhost:4000/api/v1/storage', 'https://vsss-production.up.railway.app/api/v1/storage')
WHERE "url" LIKE 'http://localhost:4000%'
   OR "thumbnailUrl" LIKE 'http://localhost:4000%'
   OR "mediumUrl" LIKE 'http://localhost:4000%'
   OR "largeUrl" LIKE 'http://localhost:4000%';
