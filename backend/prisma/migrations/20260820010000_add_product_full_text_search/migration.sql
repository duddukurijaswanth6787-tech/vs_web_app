-- Enable trigram similarity for typo-tolerant matching (e.g. "saaree" -> "saree")
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- to_tsvector(regconfig, text) is STABLE, not IMMUTABLE (its text-search
-- config is a mutable catalog object), so Postgres refuses it directly
-- inside a GENERATED column expression. Pinning "english" behind an
-- IMMUTABLE SQL wrapper is the standard, documented workaround.
CREATE OR REPLACE FUNCTION immutable_english_tsvector(text) RETURNS tsvector AS $$
  SELECT to_tsvector('english', $1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;

-- Generated, always-in-sync full-text search column. Weighted so name matches
-- rank above description/keyword matches, which rank above SKU matches.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(immutable_english_tsvector(coalesce("name", '')), 'A') ||
    setweight(immutable_english_tsvector(coalesce("shortDescription", '')), 'B') ||
    setweight(immutable_english_tsvector(coalesce("searchKeywords", '')), 'B') ||
    setweight(immutable_english_tsvector(array_to_string(coalesce("tags", ARRAY[]::text[]), ' ')), 'B') ||
    setweight(immutable_english_tsvector(coalesce("sku", '')), 'C')
  ) STORED;

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING GIN ("searchVector");

-- GIN trigram index for fuzzy/typo-tolerant name matching (similarity())
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
