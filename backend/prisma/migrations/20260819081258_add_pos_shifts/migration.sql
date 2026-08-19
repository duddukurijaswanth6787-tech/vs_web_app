-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "grandTotal" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "highlights" DROP DEFAULT;

-- CreateTable
CREATE TABLE "pos_shifts" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "openingCash" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "closingCashExpected" DECIMAL(65,30),
    "closingCashCounted" DECIMAL(65,30),
    "variance" DECIMAL(65,30),
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "pos_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_shifts_cashierId_idx" ON "pos_shifts"("cashierId");

-- CreateIndex
CREATE INDEX "pos_shifts_terminalId_idx" ON "pos_shifts"("terminalId");

-- CreateIndex
CREATE INDEX "pos_shifts_status_idx" ON "pos_shifts"("status");

-- CreateIndex
CREATE INDEX "pos_shifts_openedAt_idx" ON "pos_shifts"("openedAt");

-- CreateIndex
CREATE INDEX "dtdc_shipments_status_idx" ON "dtdc_shipments"("status");

-- CreateIndex
CREATE INDEX "dtdc_shipments_awbNumber_idx" ON "dtdc_shipments"("awbNumber");

-- CreateIndex
CREATE INDEX "gift_card_redemptions_giftCardId_idx" ON "gift_card_redemptions"("giftCardId");

-- CreateIndex
CREATE INDEX "gift_card_redemptions_customerId_idx" ON "gift_card_redemptions"("customerId");

-- CreateIndex
CREATE INDEX "gift_cards_code_idx" ON "gift_cards"("code");

-- CreateIndex
CREATE INDEX "gift_cards_purchaserId_idx" ON "gift_cards"("purchaserId");

-- CreateIndex
CREATE INDEX "loyalty_accounts_customerId_idx" ON "loyalty_accounts"("customerId");

-- CreateIndex
CREATE INDEX "loyalty_accounts_tier_idx" ON "loyalty_accounts"("tier");

-- CreateIndex
CREATE INDEX "loyalty_transactions_type_idx" ON "loyalty_transactions"("type");

-- CreateIndex
CREATE INDEX "loyalty_transactions_createdAt_idx" ON "loyalty_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "otp_challenges_purpose_idx" ON "otp_challenges"("purpose");

-- CreateIndex
CREATE INDEX "packing_jobs_orderNumber_idx" ON "packing_jobs"("orderNumber");

-- CreateIndex
CREATE INDEX "packing_jobs_assignedTo_idx" ON "packing_jobs"("assignedTo");

-- CreateIndex
CREATE INDEX "packing_scans_packingJobId_idx" ON "packing_scans"("packingJobId");

-- CreateIndex
CREATE INDEX "packing_scans_barcode_idx" ON "packing_scans"("barcode");

-- CreateIndex
CREATE INDEX "products_isTrending_idx" ON "products"("isTrending");

-- CreateIndex
CREATE INDEX "push_devices_isActive_idx" ON "push_devices"("isActive");

-- CreateIndex
CREATE INDEX "push_notification_logs_userId_idx" ON "push_notification_logs"("userId");

-- CreateIndex
CREATE INDEX "push_notification_logs_status_idx" ON "push_notification_logs"("status");

-- CreateIndex
CREATE INDEX "push_notification_logs_createdAt_idx" ON "push_notification_logs"("createdAt");

-- CreateIndex
CREATE INDEX "recently_viewed_products_productId_idx" ON "recently_viewed_products"("productId");

-- CreateIndex
CREATE INDEX "referral_codes_code_idx" ON "referral_codes"("code");

-- CreateIndex
CREATE INDEX "referral_codes_isActive_idx" ON "referral_codes"("isActive");

-- CreateIndex
CREATE INDEX "referral_redemptions_refereeId_idx" ON "referral_redemptions"("refereeId");

-- CreateIndex
CREATE INDEX "sms_logs_status_idx" ON "sms_logs"("status");

-- CreateIndex
CREATE INDEX "sms_logs_createdAt_idx" ON "sms_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "pos_shifts" ADD CONSTRAINT "pos_shifts_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
