-- Order.deliveryInstructions/preferredDeliverySlot/isGift/giftWrapMessage and
-- CustomerProfile.companyName/gstin/taxExempt were added to schema.prisma
-- and wired into checkout/profile code without ever getting a migration --
-- the live tables never had these columns, so any query selecting a full
-- Order or CustomerProfile row (checkout, GET /me, /me/addresses,
-- /me/orders, /me/pending-reviews, /wishlist/items) threw a raw Prisma
-- error on every request.
ALTER TABLE "orders" ADD COLUMN "deliveryInstructions" TEXT;
ALTER TABLE "orders" ADD COLUMN "preferredDeliverySlot" TEXT;
ALTER TABLE "orders" ADD COLUMN "isGift" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "giftWrapMessage" TEXT;

ALTER TABLE "customer_profiles" ADD COLUMN "companyName" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "gstin" TEXT;
ALTER TABLE "customer_profiles" ADD COLUMN "taxExempt" BOOLEAN NOT NULL DEFAULT false;
