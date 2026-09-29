import { UserRole } from '../enums';

/**
 * Espejo de backend/src/common/rbac/rbac-policy.ts — misma agrupación de roles.
 * Mantener sincronizado con el backend si se agregan/quitan roles del enum.
 */
const ROLE_ALIAS_GROUPS: Record<string, UserRole[]> = {
  OWNER: [UserRole.OWNER, UserRole.PLATFORM_ADMIN],
  ADMIN_AREA: [UserRole.ADMIN_AREA, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN],
  PENTESTER_QA: [UserRole.PENTESTER, UserRole.QA, UserRole.ANALYST],
  NORMAL_USER: [UserRole.NORMAL_USER],
  AUDITOR: [UserRole.AUDITOR, UserRole.VIEWER],
};

export function normalizeRole(role?: string): string {
  if (!role) {
    return '';
  }

  const direct = Object.entries(ROLE_ALIAS_GROUPS).find(([, values]) =>
    values.includes(role as UserRole),
  );

  return direct ? direct[0] : role;
}

/**
 * true si actualRole pertenece al mismo grupo que requiredRole, o si
 * actualRole es OWNER/PLATFORM_ADMIN (bypass global, igual que el backend).
 */
export function roleSatisfies(requiredRole: UserRole, actualRole?: string): boolean {
  if (!actualRole) {
    return false;
  }

  if (requiredRole === actualRole) {
    return true;
  }

  if (normalizeRole(actualRole) === 'OWNER') {
    return true;
  }

  return normalizeRole(requiredRole) === normalizeRole(actualRole);
}
