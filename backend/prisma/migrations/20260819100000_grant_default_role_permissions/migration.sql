-- Access Control -> Permissions previously had no enforcement point beyond
-- pos:view: AutoSeedService seeds the Permission catalog rows (module:action
-- codes) on every boot, but never seeded any role_permissions grants, and
-- almost every controller checked hardcoded role names (RolesGuard/@Roles)
-- rather than the granular permission rows. This release wires
-- @Permissions()/PermissionsGuard into the endpoints for the 14 cataloged
-- modules (dashboard, users, staff, products, categories, brands, inventory,
-- orders, payments, reports, settings, coupons, reviews, customers) that were
-- previously admin-only via @Roles('super_admin', 'admin') -- see the
-- controllers under src/domains for the exact endpoints. The most
-- destructive/account-security actions (delete, suspend, lock, unlock,
-- restore, role assignment on users/staff; product/brand delete) stay on
-- hardcoded @Roles('super_admin') and are intentionally NOT made
-- delegatable via a permission checkbox.
--
-- This grants every cataloged permission to super_admin and admin by
-- default, so this rollout does not change anyone's effective access on
-- deploy -- it only makes that access finally revocable/grantable per role
-- via Admin > Access Control > Permissions instead of being hardcoded. Like
-- the pos:view migration before it, this is a one-time seed: AutoSeedService
-- re-runs on every boot and would silently re-grant a deliberately revoked
-- permission if this were done there instead of in a migration.
--
-- Both the roles and the permission catalog rows are (re-)inserted here
-- rather than assumed to already exist, so this migration is self-contained
-- and grants correctly regardless of whether AutoSeedService has ever
-- booted on this database yet -- on a brand new deployment, `prisma migrate
-- deploy` runs before the app's first boot, so the roles/permissions tables
-- would otherwise still be empty at this point and the grant below would
-- silently match nothing. (Matches SYSTEM_ROLES / PERMISSION_MODULES in
-- src/database/auto-seed.service.ts; AutoSeedService's later upsert of the
-- same rows is a no-op on top of these since its role upsert applies no
-- changes to an already-existing row.)
INSERT INTO "roles" ("id", "name", "displayName", "description", "scope", "hierarchy", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'super_admin', 'Super Admin', 'Full system access', 'GLOBAL'::"role_scope", 100, true, true, now(), now()),
  (gen_random_uuid()::text, 'admin', 'Admin', 'Administrative access', 'GLOBAL'::"role_scope", 80, true, true, now(), now()),
  (gen_random_uuid()::text, 'staff', 'Staff', 'Staff member access', 'DOMAIN'::"role_scope", 50, true, true, now(), now()),
  (gen_random_uuid()::text, 'pos_operator', 'POS Operator', 'Billing counter access only — confined to the standalone Shopora POS screen, no admin console', 'DOMAIN'::"role_scope", 40, true, true, now(), now()),
  (gen_random_uuid()::text, 'customer', 'Customer', 'Customer access', 'CUSTOM'::"role_scope", 10, true, true, now(), now())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "permissions" ("id", "code", "name", "module", "scope", "isActive", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'dashboard:view', 'View Dashboard', 'dashboard', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'users:view', 'View Users', 'users', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'users:create', 'Create Users', 'users', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'users:update', 'Update Users', 'users', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'users:delete', 'Delete Users', 'users', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'staff:view', 'View Staff', 'staff', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'staff:create', 'Create Staff', 'staff', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'staff:update', 'Update Staff', 'staff', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'staff:delete', 'Delete Staff', 'staff', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'products:view', 'View Products', 'products', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'products:create', 'Create Products', 'products', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'products:update', 'Update Products', 'products', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'products:delete', 'Delete Products', 'products', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'categories:view', 'View Categories', 'categories', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'categories:create', 'Create Categories', 'categories', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'categories:update', 'Update Categories', 'categories', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'categories:delete', 'Delete Categories', 'categories', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'brands:view', 'View Brands', 'brands', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'brands:create', 'Create Brands', 'brands', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'brands:update', 'Update Brands', 'brands', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'brands:delete', 'Delete Brands', 'brands', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'inventory:view', 'View Inventory', 'inventory', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'inventory:update', 'Update Inventory', 'inventory', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'orders:view', 'View Orders', 'orders', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'orders:update', 'Update Orders', 'orders', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'payments:view', 'View Payments', 'payments', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'payments:update', 'Update Payments', 'payments', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'reports:view', 'View Reports', 'reports', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'reports:export', 'Export Reports', 'reports', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'settings:view', 'View Settings', 'settings', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'settings:update', 'Update Settings', 'settings', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'coupons:view', 'View Coupons', 'coupons', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'coupons:create', 'Create Coupons', 'coupons', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'coupons:update', 'Update Coupons', 'coupons', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'coupons:delete', 'Delete Coupons', 'coupons', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'reviews:view', 'View Reviews', 'reviews', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'reviews:update', 'Update Reviews', 'reviews', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'customers:view', 'View Customers', 'customers', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'customers:update', 'Update Customers', 'customers', 'MODULE', true, now(), now()),
  (gen_random_uuid()::text, 'pos:view', 'View Pos', 'pos', 'MODULE', true, now(), now())
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId")
SELECT r."id", p."id"
FROM "roles" r, "permissions" p
WHERE r."name" IN ('super_admin', 'admin')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
