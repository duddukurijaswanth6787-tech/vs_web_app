-- Enable trigram similarity for typo-tolerant matching (e.g. "saaree" -> "saree")
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- A GENERATED STORED column can't call to_tsvector() directly (Postgres
-- requires GENERATED expressions to be IMMUTABLE; to_tsvector is only
-- STABLE) -- and an IMMUTABLE SQL wrapper function around it still tripped
-- the same "generation expression is not immutable" check on this Postgres
-- version. A trigger-maintained plain column sidesteps the restriction
-- entirely (triggers can call anything) and is the more common, more
-- portable pattern for Postgres full-text search columns anyway.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

CREATE OR REPLACE FUNCTION products_search_vector_trigger() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW."name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."searchKeywords", '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW."tags", ARRAY[]::text[]), ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."sku", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS products_search_vector_update ON "products";
CREATE TRIGGER products_search_vector_update
  BEFORE INSERT OR UPDATE ON "products"
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_trigger();

-- Backfill existing rows -- the trigger only fires on future inserts/updates.
UPDATE "products" SET "searchVector" =
  setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("shortDescription", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("searchKeywords", '')), 'B') ||
  setweight(to_tsvector('english', array_to_string(coalesce("tags", ARRAY[]::text[]), ' ')), 'B') ||
  setweight(to_tsvector('english', coalesce("sku", '')), 'C');

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING GIN ("searchVector");

-- GIN trigram index for fuzzy/typo-tolerant name matching (similarity())
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
