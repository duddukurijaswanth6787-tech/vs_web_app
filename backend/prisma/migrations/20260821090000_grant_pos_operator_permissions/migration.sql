-- pos_operator (the role built for the standalone Shopora mobile POS app)
-- had zero role_permissions grants since it was introduced: it could only
-- ever hit the JWT-only POS endpoints (scan, checkout, sales/complete), so
-- the app's own Add Product / Add Stock screens 403'd for every real POS
-- staff account. Grant it exactly what those two flows need: creating a
-- product record + its variants/media/photos (products:create/update) and
-- recording opening/adjusted stock (inventory:update). Deliberately not
-- granted: destructive actions (delete/restore) and the admin Till & Shift
-- Dashboard (pos:view), consistent with this role's "billing counter only,
-- no admin console" description.
INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r, "permissions" p
WHERE r."name" = 'pos_operator'
  AND p."code" IN ('products:create', 'products:update', 'inventory:update')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
