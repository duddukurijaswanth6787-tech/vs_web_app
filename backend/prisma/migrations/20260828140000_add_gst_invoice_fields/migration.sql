-- Fields for GST-compliant tax invoices: shop's GSTIN, city, state, pincode.
ALTER TABLE "website_settings"
  ADD COLUMN IF NOT EXISTS "companyGstin"   TEXT,
  ADD COLUMN IF NOT EXISTS "companyCity"    TEXT,
  ADD COLUMN IF NOT EXISTS "companyState"   TEXT,
  ADD COLUMN IF NOT EXISTS "companyPincode" TEXT;
