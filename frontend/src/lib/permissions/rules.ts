import { UserProfile } from '@/types/auth.types';

export const hasRole = (user: UserProfile | null, role: string): boolean => {
  if (!user) return false;
  return user.roles.includes(role);
};

export const hasAnyRole = (user: UserProfile | null, roles: string[]): boolean => {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
};

export const hasPermission = (user: UserProfile | null, permission: string): boolean => {
  if (!user) return false;
  // super_admin bypasses all permissions checks
  if (user.roles.includes('super_admin')) return true;
  return user.permissions.includes(permission);
};

export const hasAnyPermission = (user: UserProfile | null, permissions: string[]): boolean => {
  if (!user) return false;
  if (user.roles.includes('super_admin')) return true;
  return permissions.some((p) => user.permissions.includes(p));
};

// Evaluate navigation route configurations against authenticated users
export const canAccessRoute = (
  user: UserProfile | null,
  route: { href?: string; roles?: string[]; permissions?: string[] }
): boolean => {
  if (!user) return false;

  const isPosOnlyRole =
    user.roles.includes('pos_operator') ||
    user.roles.includes('pos_staff');
  const isAdminOrSuperAdmin =
    user.roles.includes('super_admin') ||
    user.roles.includes('admin');

  // POS-restricted operators never reach the admin console at all — see
  // app/pos/layout.tsx and the confinement redirect in app/admin/layout.tsx —
  // so this only matters for a nav item that's rendered inside AdminSidebar
  // while such an account is mid-redirect.
  if (isPosOnlyRole && !isAdminOrSuperAdmin) {
    return route.href ? route.href.startsWith('/pos') : false;
  }

  // If the route doesn't specify roles or permissions, anyone authorized in admin shell can access
  const hasNoRoles = !route.roles || route.roles.length === 0;
  const hasNoPermissions = !route.permissions || route.permissions.length === 0;

  if (hasNoRoles && hasNoPermissions) {
    return true;
  }

  // Evaluate roles match
  const roleMatch = route.roles ? hasAnyRole(user, route.roles) : false;
  // Evaluate permissions match
  const permissionMatch = route.permissions ? hasAnyPermission(user, route.permissions) : false;

  return roleMatch || permissionMatch;
};
