-- Adds the "pos:view" permission (controls access to the POS Till & Shift
-- Dashboard's manager-level endpoints: /pos/analytics/summary, /pos/shifts,
-- /pos/shifts/:id/report) and grants it by default to super_admin and admin
-- so the dashboard stays reachable out of the box. This only seeds the
-- starting grant, once -- unlike AutoSeedService (which re-runs on every
-- boot), a migration never re-applies, so a super admin who later revokes
-- this from a role via Admin > Access Control > RBAC Matrix has that
-- revocation stick permanently instead of being re-granted on next deploy.

INSERT INTO "permissions" ("id", "code", "name", "module", "scope", "isActive", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'pos:view', 'View Pos', 'pos', 'MODULE', true, now(), now())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r, "permissions" p
WHERE r."name" IN ('super_admin', 'admin') AND p."code" = 'pos:view'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
