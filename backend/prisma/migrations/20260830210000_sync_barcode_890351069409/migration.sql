-- Sync barcode 890351069409 to variant COL1-XL and product
UPDATE "product_variants" 
SET "barcode" = '890351069409' 
WHERE "sku" = 'COL1-XL' OR "id" = '15cc9a81-679d-4e0f-8608-f294000b1e09';

UPDATE "products" 
SET "barcode" = '890351069409' 
WHERE "id" = '459f70fd-055d-49b7-82d6-f1ad7b5a8e67';
