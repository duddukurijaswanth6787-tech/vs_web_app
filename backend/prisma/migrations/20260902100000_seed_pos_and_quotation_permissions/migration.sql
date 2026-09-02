-- Seed/update POS and Quotations permissions with explicit names, module associations, and human-readable descriptions.
-- Also grants full access to super_admin and admin roles by default.

INSERT INTO "permissions" ("id", "code", "name", "description", "module", "scope", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'pos:view',           'View POS Terminal',        'Allows opening the POS Billing Counter terminal (/pos).',                         'pos',        'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'pos:manage',         'Manage POS Privileges',    'Controls whether cashier can give custom discounts or process returns.',          'pos',        'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'pos:add-stock',       'POS Add Stock',            'Controls access to Add Stock & Print Barcode Labels (/pos/add-stock).',            'pos',        'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'pos:printers',        'POS Hardware & Printers',  'Controls access to Thermal Receipt & Hardware Printer Settings (/pos/printers).', 'pos',        'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'pos:billing',         'POS Billing',              'Allows processing counter billing sales.',                                        'pos',        'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'pos:refund',          'POS Counter Refund',       'Allows processing counter cash returns and refunds.',                             'pos',        'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'quotations:create',   'Create Quotations',        'Controls whether cashier can create Draft Quotations.',                           'quotations', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'quotations:view',     'View Quotations',          'Allows viewing quotations list.',                                                 'quotations', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'quotations:update',   'Update Quotations',        'Allows editing draft quotations.',                                                'quotations', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'quotations:convert',  'Convert Quotations',       'Allows converting draft quotations to billed orders.',                            'quotations', 'MODULE', true, now(), now())
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "module" = EXCLUDED."module",
  "updatedAt" = now();

-- Grant all POS and Quotation permissions to super_admin and admin roles
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r, "permissions" p
WHERE r."name" IN ('super_admin', 'admin')
  AND p."code" IN (
    'pos:view', 'pos:manage', 'pos:add-stock', 'pos:printers', 'pos:billing', 'pos:refund',
    'quotations:create', 'quotations:view', 'quotations:update', 'quotations:convert'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
