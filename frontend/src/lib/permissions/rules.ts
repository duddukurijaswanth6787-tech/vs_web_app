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

export const canAccessRoute = (
  user: UserProfile | null,
  route: { href?: string; roles?: string[]; permissions?: string[] }
): boolean => {
  if (!user) return false;

  // super_admin bypasses all role and permission restrictions
  if (user.roles.includes('super_admin')) return true;

  const hasNoRoles = !route.roles || route.roles.length === 0;
  const hasNoPermissions = !route.permissions || route.permissions.length === 0;

  // If route specifies permissions, check user permissions array
  if (route.permissions && route.permissions.length > 0) {
    if (hasAnyPermission(user, route.permissions)) {
      return true;
    }
  }

  // If route specifies roles, check user roles array
  if (route.roles && route.roles.length > 0) {
    if (hasAnyRole(user, route.roles)) {
      return true;
    }
  }

  // If route requires no specific role/permission
  if (hasNoRoles && hasNoPermissions) {
    return true;
  }

  // Allow POS routes for POS roles
  if (route.href?.startsWith('/pos')) {
    return true;
  }

  return false;
};
