// NOTE: deliberately NOT `server-only`. This module is pure (no secrets, no DB) and is consumed by
// the Edge middleware (proxy.ts) as well as route handlers, so it must stay edge/middleware-safe.
import { ADMIN_PERMISSION_CATALOG, AdminPermissionTier, AdminPermissionCatalogItem } from "@/lib/admin-permissions/catalog";
import { AdminPermissionRoleKey, isAdminPermissionRoleKey, roleAllowsTier } from "@/lib/admin-permissions/roleMatrix";

// Pure access resolver for the reworked permission model (docs/permission-model.md).
//
// Given a user's roles (+ per-user admin-function grants for Administrator) and a requested
// route, returns an allow/block decision. This function changes NO behavior on its own — it is
// only consulted by the proxy / route guards when role enforcement is enabled (see
// roleEnforcementEnabled). Owner bypasses everything; unmapped routes default-allow; the
// /admin/permissions area is never-blocked so an administrator can't be locked out.

const TIER_RANK: Record<AdminPermissionTier, number> = { view: 1, edit: 2, process: 3, admin: 4, security: 5 };

// Lockout-safety: these paths are always allowed (the permissions area must stay reachable so
// access can be reviewed/fixed; admin home is the landing). The mutation routes that actually
// CHANGE security still carry the security tier and are owner-only.
const NEVER_BLOCK_SCOPES = ["/admin/permissions", "/admin/permissions/*", "/api/admin/permissions", "/api/admin/permissions/*"] as const;

function routeScopeMatches(scope: string, pathname: string): boolean {
  const s = scope.split("?")[0];
  if (s === pathname) return true;
  const segScope = s.split("/").filter(Boolean);
  const segPath = pathname.split("/").filter(Boolean);
  const isParam = (seg: string) => seg.startsWith("[") || seg.startsWith(":");
  if (segScope[segScope.length - 1] === "*") {
    const prefix = segScope.slice(0, -1);
    if (segPath.length < prefix.length) return false;
    return prefix.every((seg, i) => seg === segPath[i] || isParam(seg));
  }
  if (segScope.length !== segPath.length) return false;
  return segScope.every((seg, i) => seg === segPath[i] || isParam(seg));
}

export function isNeverBlockPath(pathname: string): boolean {
  const clean = String(pathname || "").split("?")[0];
  return NEVER_BLOCK_SCOPES.some((scope) => routeScopeMatches(scope, clean));
}

export function catalogItemsForPath(pathname: string): AdminPermissionCatalogItem[] {
  const clean = String(pathname || "").split("?")[0];
  return ADMIN_PERMISSION_CATALOG.filter((item) => item.routeScopes.some((scope) => routeScopeMatches(scope, clean)));
}

export type AccessDecision = {
  allowed: boolean;
  matchedPermissionKeys: string[];
  requiredTier: AdminPermissionTier | null;
  reason: string;
};

export type AccessInput = {
  isOwner: boolean;
  roleKeys: string[];
  /** Per-user granted admin-function permission keys (for the Administrator role). */
  grantedAdminPermissionKeys?: string[];
  pathname: string;
  method?: string;
};

export function resolveAccess(input: AccessInput): AccessDecision {
  // 1. Owner bypasses everything.
  if (input.isOwner) return { allowed: true, matchedPermissionKeys: [], requiredTier: null, reason: "Owner has full access." };

  // 2. Lockout-safety paths stay reachable.
  if (isNeverBlockPath(input.pathname)) return { allowed: true, matchedPermissionKeys: [], requiredTier: null, reason: "Never-block path (lockout safety)." };

  // 3. Find the permissions governing this route.
  const items = catalogItemsForPath(input.pathname);
  if (!items.length) return { allowed: true, matchedPermissionKeys: [], requiredTier: null, reason: "No permission mapping; default allow." };

  const matchedPermissionKeys = items.map((item) => item.key);
  // Most-restrictive tier governs (e.g. POST apply-payment matches both view and process -> process).
  const requiredTier = items.reduce<AdminPermissionTier>((max, item) => (TIER_RANK[item.tier] > TIER_RANK[max] ? item.tier : max), items[0].tier);

  // 4. Security tier: Owner-only (a non-owner reached here, so block).
  if (requiredTier === "security") {
    return { allowed: false, matchedPermissionKeys, requiredTier, reason: "Security functions are Owner-only." };
  }

  // 5. Admin tier: Administrator with a per-user grant for one of the matched admin permissions.
  if (requiredTier === "admin") {
    const grants = new Set(input.grantedAdminPermissionKeys || []);
    const adminKeys = items.filter((item) => item.tier === "admin").map((item) => item.key);
    const granted = input.roleKeys.includes("administrator") && adminKeys.some((key) => grants.has(key));
    return granted
      ? { allowed: true, matchedPermissionKeys, requiredTier, reason: "Administrator is granted this admin function." }
      : { allowed: false, matchedPermissionKeys, requiredTier, reason: "Admin function not granted to this user." };
  }

  // 6. view / edit / process: allowed if ANY of the user's roles permits the required tier.
  const allowed = input.roleKeys.some((rk) => isAdminPermissionRoleKey(rk) && roleAllowsTier(rk as AdminPermissionRoleKey, requiredTier));
  return {
    allowed,
    matchedPermissionKeys,
    requiredTier,
    reason: allowed ? `A role permits the ${requiredTier} tier.` : `No role permits the ${requiredTier} tier.`,
  };
}

// Single env kill-switch. Default OFF -> resolver is never consulted, no behavior change.
export function roleEnforcementEnabled(): boolean {
  const raw = String(process.env.BARSH_ROLE_ENFORCEMENT_ENABLED ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true";
}
