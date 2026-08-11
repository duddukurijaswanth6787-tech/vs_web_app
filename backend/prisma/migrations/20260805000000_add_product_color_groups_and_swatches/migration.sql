-- AlterTable
ALTER TABLE "attribute_options" ADD COLUMN IF NOT EXISTS "swatchImageUrl" TEXT;

-- AlterTable
ALTER TABLE "attributes" ADD COLUMN IF NOT EXISTS "usesSwatch" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "product_media" ADD COLUMN IF NOT EXISTS "colorGroupId" TEXT;

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "colorGroupId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "product_color_groups" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "colorAttributeOptionId" TEXT NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_color_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_color_groups_productId_idx" ON "product_color_groups"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_color_groups_colorAttributeOptionId_idx" ON "product_color_groups"("colorAttributeOptionId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "product_color_groups_productId_colorAttributeOptionId_key" ON "product_color_groups"("productId", "colorAttributeOptionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_media_colorGroupId_idx" ON "product_media"("colorGroupId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "product_variants_colorGroupId_idx" ON "product_variants"("colorGroupId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_colorGroupId_fkey') THEN
        ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_colorGroupId_fkey" FOREIGN KEY ("colorGroupId") REFERENCES "product_color_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_color_groups_productId_fkey') THEN
        ALTER TABLE "product_color_groups" ADD CONSTRAINT "product_color_groups_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_color_groups_colorAttributeOptionId_fkey') THEN
        ALTER TABLE "product_color_groups" ADD CONSTRAINT "product_color_groups_colorAttributeOptionId_fkey" FOREIGN KEY ("colorAttributeOptionId") REFERENCES "attribute_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_media_colorGroupId_fkey') THEN
        ALTER TABLE "product_media" ADD CONSTRAINT "product_media_colorGroupId_fkey" FOREIGN KEY ("colorGroupId") REFERENCES "product_color_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
