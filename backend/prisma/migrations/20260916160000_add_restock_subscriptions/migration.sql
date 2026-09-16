-- CreateTable
CREATE TABLE IF NOT EXISTS "restock_subscriptions" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "size" TEXT,
    "color" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restock_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "restock_subscriptions_productId_idx" ON "restock_subscriptions"("productId");
CREATE INDEX IF NOT EXISTS "restock_subscriptions_variantId_idx" ON "restock_subscriptions"("variantId");
CREATE INDEX IF NOT EXISTS "restock_subscriptions_email_idx" ON "restock_subscriptions"("email");
CREATE INDEX IF NOT EXISTS "restock_subscriptions_phone_idx" ON "restock_subscriptions"("phone");
CREATE INDEX IF NOT EXISTS "restock_subscriptions_status_idx" ON "restock_subscriptions"("status");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'restock_subscriptions_productId_fkey'
    ) THEN
        ALTER TABLE "restock_subscriptions" ADD CONSTRAINT "restock_subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
