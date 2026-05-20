import { UserRole } from "../enums";
import {
  canCreateTargetRole,
  canCreateUsers,
  canRolePerform,
  minimumPasswordLengthForCreator,
  roleSatisfies,
} from "./rbac-policy";

describe("RBAC Policy", () => {
  it("accepts equivalent roles in guard checks", () => {
    expect(roleSatisfies(UserRole.CLIENT_ADMIN, UserRole.ADMIN_AREA)).toBe(true);
    expect(roleSatisfies(UserRole.ANALYST, UserRole.QA)).toBe(true);
    expect(roleSatisfies(UserRole.VIEWER, UserRole.AUDITOR)).toBe(true);
  });

  it("keeps owner as global override", () => {
    expect(roleSatisfies(UserRole.ANALYST, UserRole.OWNER)).toBe(true);
    expect(canRolePerform(UserRole.OWNER, "users", "delete")).toBe(true);
  });

  it("enforces user-creation matrix", () => {
    expect(canCreateUsers(UserRole.QA)).toBe(false);
    expect(canCreateUsers(UserRole.ADMIN_AREA)).toBe(true);

    expect(canCreateTargetRole(UserRole.ADMIN_AREA, UserRole.NORMAL_USER)).toBe(
      true,
    );
    expect(canCreateTargetRole(UserRole.ADMIN_AREA, UserRole.OWNER)).toBe(false);
  });

  it("enforces minimum password by creator type", () => {
    expect(minimumPasswordLengthForCreator(UserRole.OWNER)).toBe(1);
    expect(minimumPasswordLengthForCreator(UserRole.CLIENT_ADMIN)).toBe(6);
  });
});
