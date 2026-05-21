import { Role, STAFF_ROLES } from '../enums/role.enum';

export interface AuthUser {
  id: string;
  role: string;
  organizationId?: string | null;
  linkedTenantId?: string | null;
}

/**
 * Returns the effective ownerId for DB queries.
 * - SUPER_ADMIN: undefined → no ownership filter (sees all)
 * - Staff (FINANZAS/VENDEDOR/MANTENIMIENTO): their organizationId (parent ADMIN)
 * - INQUILINO: undefined (filtered separately via linkedTenantId)
 * - ADMIN/CLIENTE: their own id
 */
export function resolveOwnerId(user: AuthUser): string | undefined {
  if (user.role === Role.SUPER_ADMIN) return undefined;
  if (user.role === Role.INQUILINO) return undefined;
  if (STAFF_ROLES.has(user.role as Role) && user.organizationId) return user.organizationId;
  return user.id;
}

export function isSuperAdmin(user: AuthUser): boolean {
  return user.role === Role.SUPER_ADMIN;
}

export function isInquilino(user: AuthUser): boolean {
  return user.role === Role.INQUILINO;
}
