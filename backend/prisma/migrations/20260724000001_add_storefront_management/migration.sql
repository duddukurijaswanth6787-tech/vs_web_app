-- CreateEnum
CREATE TYPE "social_platform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'YOUTUBE', 'TWITTER', 'PINTEREST', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "newsletter_status" AS ENUM ('SUBSCRIBED', 'UNSUBSCRIBED', 'PENDING');

-- CreateEnum
CREATE TYPE "feature_category" AS ENUM ('HOMEPAGE', 'CUSTOMER', 'CHECKOUT', 'SEARCH', 'AI', 'PRODUCT', 'MARKETING', 'SOCIAL');

-- CreateTable
CREATE TABLE "website_settings" (
    "id" TEXT NOT NULL,
    "storeName" TEXT NOT NULL DEFAULT 'Vasanthi Designers',
    "storeDescription" TEXT,
    "logo" TEXT,
    "favicon" TEXT,
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "whatsappNumber" TEXT,
    "supportHours" TEXT,
    "companyAddress" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "language" TEXT NOT NULL DEFAULT 'en',
    "copyrightText" TEXT,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "website_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_categories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "platform" "social_platform" NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_sections" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "footer_links" (
    "id" TEXT NOT NULL,
    "footerSectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "openInNewTab" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_toggles" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "category" "feature_category" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_toggles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "newsletter_status" NOT NULL DEFAULT 'SUBSCRIBED',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "homepage_sections_key_key" ON "homepage_sections"("key");

-- CreateIndex
CREATE INDEX "homepage_sections_displayOrder_idx" ON "homepage_sections"("displayOrder");

-- CreateIndex
CREATE INDEX "homepage_sections_enabled_idx" ON "homepage_sections"("enabled");

-- CreateIndex
CREATE INDEX "homepage_sections_deletedAt_idx" ON "homepage_sections"("deletedAt");

-- CreateIndex
CREATE INDEX "homepage_categories_categoryId_idx" ON "homepage_categories"("categoryId");

-- CreateIndex
CREATE INDEX "homepage_categories_displayOrder_idx" ON "homepage_categories"("displayOrder");

-- CreateIndex
CREATE INDEX "social_links_enabled_idx" ON "social_links"("enabled");

-- CreateIndex
CREATE INDEX "social_links_displayOrder_idx" ON "social_links"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_platform_key" ON "social_links"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "footer_sections_key_key" ON "footer_sections"("key");

-- CreateIndex
CREATE INDEX "footer_sections_displayOrder_idx" ON "footer_sections"("displayOrder");

-- CreateIndex
CREATE INDEX "footer_links_footerSectionId_idx" ON "footer_links"("footerSectionId");

-- CreateIndex
CREATE INDEX "footer_links_displayOrder_idx" ON "footer_links"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "feature_toggles_key_key" ON "feature_toggles"("key");

-- CreateIndex
CREATE INDEX "feature_toggles_key_idx" ON "feature_toggles"("key");

-- CreateIndex
CREATE INDEX "feature_toggles_enabled_idx" ON "feature_toggles"("enabled");

-- CreateIndex
CREATE INDEX "feature_toggles_category_idx" ON "feature_toggles"("category");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_email_idx" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_status_idx" ON "newsletter_subscriptions"("status");

-- AddForeignKey
ALTER TABLE "homepage_categories" ADD CONSTRAINT "homepage_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "footer_links" ADD CONSTRAINT "footer_links_footerSectionId_fkey" FOREIGN KEY ("footerSectionId") REFERENCES "footer_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
