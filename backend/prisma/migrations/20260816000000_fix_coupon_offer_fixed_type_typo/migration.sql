-- Critical fix: the "FLAT500" coupon was seeded with type='FIXED', which is
-- not a valid CouponType ('FLAT'/'PERCENTAGE'/'FREE_SHIPPING'). Because the
-- type column has no DB-level enum constraint, the bad value was accepted
-- silently. At apply time, coupon.service.ts's type check falls through to
-- the percentage branch for any unrecognized type, so this coupon computed
-- as (orderAmount * 500) / 100 -- a 500% discount -- instead of a flat ₹500
-- off. On any order >= ~₹4,000 (its own minimum order requirement) this
-- coupon currently gives the entire order for free. Fixing the type to the
-- correct 'FLAT' value restores the intended flat ₹500 discount.
UPDATE "coupons" SET "type" = 'FLAT' WHERE "code" = 'FLAT500' AND "type" = 'FIXED';

-- Same seed typo on the "Bridal Season Special" offer -- 'FIXED' is not a
-- valid OfferType. Offers aren't currently applied to pricing anywhere in
-- checkout, so this row has no live financial impact today, but it's
-- corrected for data integrity and so admin can edit it without the type
-- silently resetting to whatever the dropdown defaults to.
UPDATE "offers" SET "type" = 'FESTIVAL' WHERE "name" = 'Bridal Season Special' AND "type" = 'FIXED';
