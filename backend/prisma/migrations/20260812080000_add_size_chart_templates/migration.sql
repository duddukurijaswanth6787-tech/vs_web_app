-- CreateTable
CREATE TABLE IF NOT EXISTS "size_chart_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "garmentType" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'inch',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "size_chart_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "size_chart_rows" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "measurements" JSONB NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "size_chart_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "size_chart_templates_slug_key" ON "size_chart_templates"("slug");
CREATE INDEX IF NOT EXISTS "size_chart_templates_status_idx" ON "size_chart_templates"("status");
CREATE INDEX IF NOT EXISTS "size_chart_rows_templateId_idx" ON "size_chart_rows"("templateId");
CREATE UNIQUE INDEX IF NOT EXISTS "size_chart_rows_templateId_size_key" ON "size_chart_rows"("templateId", "size");

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sizeChartTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "size_chart_rows" DROP CONSTRAINT IF EXISTS "size_chart_rows_templateId_fkey";
ALTER TABLE "size_chart_rows" ADD CONSTRAINT "size_chart_rows_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "size_chart_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "products_sizeChartTemplateId_fkey";
ALTER TABLE "products" ADD CONSTRAINT "products_sizeChartTemplateId_fkey" FOREIGN KEY ("sizeChartTemplateId") REFERENCES "size_chart_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
