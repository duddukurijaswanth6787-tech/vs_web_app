-- Seeds the three quotation permissions and grants them a sensible starting
-- set of roles. Following the pos:view precedent, this is a migration rather
-- than AutoSeedService: a migration never re-applies, so a super admin who
-- later revokes one of these in Admin > Access Control > RBAC Matrix has that
-- revocation stick instead of being re-granted on the next deploy.
--
-- convert is separate from update on purpose. Drafting a quote costs nothing;
-- converting one takes payment and deducts stock, so a manager can let staff
-- prepare quotes without also letting them close the sale.

INSERT INTO "permissions" ("id", "code", "name", "module", "scope", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'quotations:view',    'View Quotations',    'quotations', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'quotations:create',  'Create Quotations',  'quotations', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'quotations:update',  'Update Quotations',  'quotations', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'quotations:convert', 'Convert Quotations', 'quotations', 'MODULE', true, now(), now())
ON CONFLICT ("code") DO NOTHING;

-- super_admin and admin get the full set, so the feature is reachable on day one.
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r, "permissions" p
WHERE r."name" IN ('super_admin', 'admin')
  AND p."code" IN ('quotations:view', 'quotations:create', 'quotations:update', 'quotations:convert')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;

-- Counter staff may prepare and read quotes but not close them into a sale.
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r, "permissions" p
WHERE r."name" = 'pos_operator'
  AND p."code" IN ('quotations:view', 'quotations:create')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
