-- AlterTable
CREATE INDEX IF NOT EXISTS "users_phone_idx" ON "users"("phone");

-- CreateTable
CREATE TABLE IF NOT EXISTS "otp_challenges" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'LOGIN',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "loyalty_accounts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
    "lifetimeRedeemed" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'BRONZE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "gift_cards" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "initialAmount" DECIMAL(65,30) NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "purchaserId" TEXT,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "message" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "gift_cards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "gift_card_redemptions" (
    "id" TEXT NOT NULL,
    "giftCardId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "orderId" TEXT,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gift_card_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "referral_codes" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "rewardPoints" INTEGER NOT NULL DEFAULT 100,
    "refereePoints" INTEGER NOT NULL DEFAULT 50,
    "usageLimit" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "referral_redemptions" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "referrerReward" INTEGER NOT NULL DEFAULT 0,
    "refereeReward" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referral_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "recently_viewed_products" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "recently_viewed_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "packing_jobs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "assignedTo" TEXT,
    "barcode" TEXT,
    "labelUrl" TEXT,
    "packedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "packing_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "packing_scans" (
    "id" TEXT NOT NULL,
    "packingJobId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "scanType" TEXT NOT NULL DEFAULT 'VERIFY',
    "success" BOOLEAN NOT NULL DEFAULT true,
    "scannedBy" TEXT,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "packing_scans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "push_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'WEB',
    "deviceName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sms_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "push_notification_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "targetCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_notification_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "dtdc_shipments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "awbNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "serviceType" TEXT NOT NULL DEFAULT 'STANDARD',
    "labelUrl" TEXT,
    "trackingUrl" TEXT,
    "weightKg" DECIMAL(65,30),
    "pieces" INTEGER NOT NULL DEFAULT 1,
    "consigneeName" TEXT,
    "consigneePhone" TEXT,
    "consigneePincode" TEXT,
    "rawRequest" JSONB,
    "rawResponse" JSONB,
    "bookedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dtdc_shipments_pkey" PRIMARY KEY ("id")
);

-- Indexes & uniques
CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_accounts_customerId_key" ON "loyalty_accounts"("customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "gift_cards_code_key" ON "gift_cards"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_customerId_key" ON "referral_codes"("customerId");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_codes_code_key" ON "referral_codes"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_redemptions_referralCodeId_refereeId_key" ON "referral_redemptions"("referralCodeId", "refereeId");
CREATE UNIQUE INDEX IF NOT EXISTS "recently_viewed_products_customerId_productId_key" ON "recently_viewed_products"("customerId", "productId");
CREATE UNIQUE INDEX IF NOT EXISTS "push_devices_token_key" ON "push_devices"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "dtdc_shipments_awbNumber_key" ON "dtdc_shipments"("awbNumber");

CREATE INDEX IF NOT EXISTS "otp_challenges_phone_idx" ON "otp_challenges"("phone");
CREATE INDEX IF NOT EXISTS "otp_challenges_expiresAt_idx" ON "otp_challenges"("expiresAt");
CREATE INDEX IF NOT EXISTS "loyalty_transactions_accountId_idx" ON "loyalty_transactions"("accountId");
CREATE INDEX IF NOT EXISTS "gift_cards_status_idx" ON "gift_cards"("status");
CREATE INDEX IF NOT EXISTS "packing_jobs_status_idx" ON "packing_jobs"("status");
CREATE INDEX IF NOT EXISTS "packing_jobs_orderId_idx" ON "packing_jobs"("orderId");
CREATE INDEX IF NOT EXISTS "push_devices_userId_idx" ON "push_devices"("userId");
CREATE INDEX IF NOT EXISTS "sms_logs_phone_idx" ON "sms_logs"("phone");
CREATE INDEX IF NOT EXISTS "dtdc_shipments_orderId_idx" ON "dtdc_shipments"("orderId");
CREATE INDEX IF NOT EXISTS "recently_viewed_products_customerId_viewedAt_idx" ON "recently_viewed_products"("customerId", "viewedAt");

-- FKs
ALTER TABLE "otp_challenges" ADD CONSTRAINT "otp_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gift_cards" ADD CONSTRAINT "gift_cards_purchaserId_fkey" FOREIGN KEY ("purchaserId") REFERENCES "customer_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_giftCardId_fkey" FOREIGN KEY ("giftCardId") REFERENCES "gift_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "gift_card_redemptions" ADD CONSTRAINT "gift_card_redemptions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recently_viewed_products" ADD CONSTRAINT "recently_viewed_products_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recently_viewed_products" ADD CONSTRAINT "recently_viewed_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "packing_jobs" ADD CONSTRAINT "packing_jobs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "packing_scans" ADD CONSTRAINT "packing_scans_packingJobId_fkey" FOREIGN KEY ("packingJobId") REFERENCES "packing_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "push_notification_logs" ADD CONSTRAINT "push_notification_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dtdc_shipments" ADD CONSTRAINT "dtdc_shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
