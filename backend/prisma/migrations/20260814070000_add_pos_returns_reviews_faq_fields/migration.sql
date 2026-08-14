-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "checkout_session_status" AS ENUM ('DRAFT', 'WAITING_FOR_WEB', 'IN_PROGRESS_ON_WEB', 'COMPLETED', 'CANCELLED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "order_channel" AS ENUM ('ONLINE_STORE', 'POS_SHOPORA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "pos_payment_method" AS ENUM ('CASH', 'UPI', 'CARD', 'CREDIT', 'SPLIT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "checkout_sessions" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "handoffToken" TEXT NOT NULL,
    "shopId" TEXT NOT NULL DEFAULT 'MAIN_STORE',
    "deviceId" TEXT,
    "cashierId" TEXT NOT NULL,
    "cart" JSONB NOT NULL,
    "customer" JSONB,
    "subtotal" DECIMAL(65,30) NOT NULL,
    "discountTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(65,30) NOT NULL,
    "status" "checkout_session_status" NOT NULL DEFAULT 'WAITING_FOR_WEB',
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "return_item_images" (
    "id" TEXT NOT NULL,
    "returnItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_item_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "review_reports" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "checkout_sessions_sessionId_key" ON "checkout_sessions"("sessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "checkout_sessions_handoffToken_key" ON "checkout_sessions"("handoffToken");
CREATE UNIQUE INDEX IF NOT EXISTS "checkout_sessions_orderId_key" ON "checkout_sessions"("orderId");
CREATE INDEX IF NOT EXISTS "checkout_sessions_handoffToken_idx" ON "checkout_sessions"("handoffToken");
CREATE INDEX IF NOT EXISTS "checkout_sessions_status_idx" ON "checkout_sessions"("status");
CREATE INDEX IF NOT EXISTS "checkout_sessions_sessionId_idx" ON "checkout_sessions"("sessionId");

CREATE INDEX IF NOT EXISTS "return_item_images_returnItemId_idx" ON "return_item_images"("returnItemId");

CREATE UNIQUE INDEX IF NOT EXISTS "review_reports_reviewId_userId_key" ON "review_reports"("reviewId", "userId");
CREATE INDEX IF NOT EXISTS "review_reports_reviewId_idx" ON "review_reports"("reviewId");

-- AddForeignKey
ALTER TABLE "checkout_sessions" DROP CONSTRAINT IF EXISTS "checkout_sessions_orderId_fkey";
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "checkout_sessions" DROP CONSTRAINT IF EXISTS "checkout_sessions_cashierId_fkey";
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "return_item_images" DROP CONSTRAINT IF EXISTS "return_item_images_returnItemId_fkey";
ALTER TABLE "return_item_images" ADD CONSTRAINT "return_item_images_returnItemId_fkey" FOREIGN KEY ("returnItemId") REFERENCES "return_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_reports" DROP CONSTRAINT IF EXISTS "review_reports_reviewId_fkey";
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "review_reports" DROP CONSTRAINT IF EXISTS "review_reports_userId_fkey";
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: orders (POS fields) - safe: NOT NULL with default backfills existing rows; nullable columns default to NULL
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "channel" "order_channel" NOT NULL DEFAULT 'ONLINE_STORE';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" "pos_payment_method";
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "terminalId" TEXT;

-- AlterTable: return_requests - nullable, safe
ALTER TABLE "return_requests" ADD COLUMN IF NOT EXISTS "refundPreference" TEXT;

-- AlterTable: reviews - NOT NULL with default, safe
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "reportCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: faqs.slug is NOT NULL + UNIQUE with no default, so existing rows need a
-- backfilled value before the constraint can be applied. Derive it from `question`
-- the same way FaqService.generateSlug() does, then guarantee uniqueness by suffixing
-- the row id (uuid), which cannot collide.
ALTER TABLE "faqs" ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "faqs"
SET "slug" = (
  CASE
    WHEN trim(both '-' from regexp_replace(lower(question), '[^a-z0-9]+', '-', 'g')) = ''
      THEN 'faq'
    ELSE left(trim(both '-' from regexp_replace(lower(question), '[^a-z0-9]+', '-', 'g')), 200)
  END
) || '-' || substr(id, 1, 8)
WHERE "slug" IS NULL;

ALTER TABLE "faqs" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "faqs_slug_key" ON "faqs"("slug");
