-- Seed 'pos_app' System Role for POS Mobile App Operators
INSERT INTO "roles" ("id", "name", "displayName", "description", "scope", "hierarchy", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'pos_app',
  'POS App',
  'Shopora Mobile POS App operator role for counter sales, billing, barcode scanning, stock intake, and quotations.',
  'DOMAIN'::"role_scope",
  40,
  true,
  true,
  now(),
  now()
)
ON CONFLICT ("name") DO UPDATE
SET "displayName" = 'POS App',
    "description" = 'Shopora Mobile POS App operator role for counter sales, billing, barcode scanning, stock intake, and quotations.',
    "isSystem" = true,
    "isActive" = true,
    "hierarchy" = 40,
    "updatedAt" = now();

-- Grant essential POS and Catalog permissions to pos_app role
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r, "permissions" p
WHERE r."name" = 'pos_app'
  AND p."code" IN (
    'pos:view',
    'pos:billing',
    'pos:add-stock',
    'pos:refund',
    'pos:printers',
    'products:view',
    'products:create',
    'products:update',
    'inventory:view',
    'inventory:update',
    'categories:view',
    'brands:view',
    'orders:view',
    'orders:update',
    'payments:view',
    'customers:view',
    'users:create',
    'users:view',
    'quotations:view',
    'quotations:create',
    'quotations:update',
    'quotations:convert'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
