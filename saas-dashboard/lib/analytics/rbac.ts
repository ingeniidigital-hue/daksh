import { UserRole } from "./types";

export class RbacForbiddenError extends Error {
  public attemptedRole?: string;
  public requiredRoles: string[];

  constructor(attemptedRole: string | undefined, requiredRoles: string[]) {
    super(`Access denied: Role "${attemptedRole || "unspecified"}" lacks required permissions. Required: ${requiredRoles.join(", ")}`);
    this.name = "RbacForbiddenError";
    this.attemptedRole = attemptedRole;
    this.requiredRoles = requiredRoles;
  }
}

export function verifyAdminRole(role?: string): void {
  const allowed = ["admin", "studio_owner", "finance"];
  if (!role || !allowed.includes(role.toLowerCase())) {
    throw new RbacForbiddenError(role, allowed);
  }
}
