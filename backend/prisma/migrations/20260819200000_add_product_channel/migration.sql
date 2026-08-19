-- Adds Product.channel (STORE | ONLINE | BOTH), controlling where a product
-- is sellable: the in-store POS register, the online storefront, or both.
-- Stock/inventory stays a single shared pool per variant regardless of
-- channel -- this only controls where the product is offered, not how much
-- of it exists. Defaults to 'BOTH' for all existing rows so this rollout
-- doesn't hide anything that was already visible everywhere.
ALTER TABLE "products" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'BOTH';

CREATE INDEX "products_channel_idx" ON "products"("channel");
