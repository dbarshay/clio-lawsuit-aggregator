import {
  adminUsersPhaseW8DryRunDecision,
  adminUsersPhaseW8IsPermissionEnforcementEnabled,
  type AdminUsersPhaseW8Actor,
  type AdminUsersPhaseW8Decision,
  type AdminUsersPhaseW8RouteContext,
} from "./admin-users-permission-enforcement-phase-w8";

export const ADMIN_USERS_PHASE_W9_ROUTE_GUARD_PACKAGE = true as const;

export type AdminUsersPhaseW9GuardResult = AdminUsersPhaseW8Decision & {
  guardPackageReady: true;
  routeGuardWired: false;
  responseBlockingImplemented: false;
};

export function adminUsersPhaseW9EvaluateRouteAccess(
  actor: AdminUsersPhaseW8Actor,
  route: AdminUsersPhaseW8RouteContext,
  env: NodeJS.ProcessEnv = process.env
): AdminUsersPhaseW9GuardResult {
  const decision = adminUsersPhaseW8DryRunDecision(actor, route, env);

  return {
    ...decision,
    guardPackageReady: true,
    routeGuardWired: false,
    responseBlockingImplemented: false,
    routeBlockingActive: false,
    uiHidingActive: false,
    databaseMutated: false,
  };
}

export function adminUsersPhaseW9BuildDenyMessage(result: AdminUsersPhaseW9GuardResult): string {
  if (result.allowed) return "Allowed.";
  return `Permission preview would block this action: ${result.reason}`;
}

export function adminUsersPhaseW9ActivationPreflight(env: NodeJS.ProcessEnv = process.env): {
  killSwitchEnabled: boolean;
  routeGuardWired: false;
  responseBlockingImplemented: false;
  ownerNoLockoutRequired: true;
  rollbackRequired: true;
  safeToActivateInW9: false;
} {
  return {
    killSwitchEnabled: adminUsersPhaseW8IsPermissionEnforcementEnabled(env),
    routeGuardWired: false,
    responseBlockingImplemented: false,
    ownerNoLockoutRequired: true,
    rollbackRequired: true,
    safeToActivateInW9: false,
  };
}
