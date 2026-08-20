-- Enable trigram similarity for typo-tolerant matching (e.g. "saaree" -> "saree")
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Generated, always-in-sync full-text search column. Weighted so name matches
-- rank above description/keyword matches, which rank above SKU matches.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('english', coalesce("shortDescription", '')), 'B') ||
    setweight(to_tsvector('english', coalesce("searchKeywords", '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce("tags", ARRAY[]::text[]), ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce("sku", '')), 'C')
  ) STORED;

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING GIN ("searchVector");

-- GIN trigram index for fuzzy/typo-tolerant name matching (similarity())
CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
