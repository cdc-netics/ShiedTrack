import { UserRole } from "../enums";

export type RbacAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "assign"
  | "*";

export type RbacResource =
  | "users"
  | "clients"
  | "projects"
  | "findings"
  | "evidence"
  | "*";

const ROLE_ALIAS_GROUPS: Record<string, UserRole[]> = {
  OWNER: [UserRole.OWNER, UserRole.PLATFORM_ADMIN],
  ADMIN_AREA: [
    UserRole.ADMIN_AREA,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
  ],
  PENTESTER_QA: [UserRole.PENTESTER, UserRole.QA, UserRole.ANALYST],
  NORMAL_USER: [UserRole.NORMAL_USER],
  AUDITOR: [UserRole.AUDITOR, UserRole.VIEWER],
};

const SYSTEM_PERMISSION_MATRIX: Record<
  string,
  Partial<Record<RbacResource, RbacAction[]>>
> = {
  OWNER: {
    "*": ["*"],
  },
  ADMIN_AREA: {
    users: ["create", "read", "update", "assign"],
    clients: ["read", "update", "assign"],
    projects: ["create", "read", "update", "assign"],
    findings: ["read", "update"],
    evidence: ["read"],
  },
  PENTESTER_QA: {
    clients: ["create", "read", "update", "assign"],
    projects: ["create", "read", "update", "assign"],
    findings: ["create", "read", "update"],
    evidence: ["create", "read", "update"],
  },
  NORMAL_USER: {
    projects: ["read"],
    findings: ["create", "read", "update"],
    evidence: ["create", "read", "update"],
  },
  AUDITOR: {
    clients: ["read"],
    projects: ["read"],
    findings: ["read"],
    evidence: ["read"],
  },
};

const CREATOR_ALLOWED_TARGET_ROLES: Record<string, UserRole[]> = {
  OWNER: Object.values(UserRole),
  ADMIN_AREA: [UserRole.NORMAL_USER, UserRole.AUDITOR, UserRole.VIEWER],
  PENTESTER_QA: [],
  NORMAL_USER: [],
  AUDITOR: [],
};

export function normalizeRole(role?: string): string {
  if (!role) {
    return "";
  }

  const direct = Object.entries(ROLE_ALIAS_GROUPS).find(([, values]) =>
    values.includes(role as UserRole),
  );

  if (direct) {
    return direct[0];
  }

  return role;
}

export function roleSatisfies(requiredRole: UserRole, actualRole?: string): boolean {
  if (!actualRole) {
    return false;
  }

  if (requiredRole === actualRole) {
    return true;
  }

  const requiredNormalized = normalizeRole(requiredRole);
  const actualNormalized = normalizeRole(actualRole);

  if (actualNormalized === "OWNER") {
    return true;
  }

  return requiredNormalized === actualNormalized;
}

export function canRolePerform(
  role: string,
  resource: RbacResource,
  action: RbacAction,
): boolean {
  const normalized = normalizeRole(role);
  const permissions = SYSTEM_PERMISSION_MATRIX[normalized];

  if (!permissions) {
    return false;
  }

  const wildcardActions = permissions["*"] || [];
  if (wildcardActions.includes("*")) {
    return true;
  }

  const resourceActions = permissions[resource] || [];
  return resourceActions.includes("*") || resourceActions.includes(action);
}

export function canCreateUsers(role?: string): boolean {
  const normalized = normalizeRole(role);
  return normalized === "OWNER" || normalized === "ADMIN_AREA";
}

export function canCreateTargetRole(
  creatorRole: string,
  targetRole: UserRole,
): boolean {
  const normalizedCreator = normalizeRole(creatorRole);
  const allowed = CREATOR_ALLOWED_TARGET_ROLES[normalizedCreator] || [];

  if (normalizedCreator === "OWNER") {
    return true;
  }

  return allowed.includes(targetRole);
}

export function minimumPasswordLengthForCreator(role?: string): number {
  const normalized = normalizeRole(role);
  if (normalized === "OWNER") {
    return 1;
  }

  return 6;
}
