export const ADMIN_USERS_WRITE_CONTRACT_MODE = "preview-only-no-active-routes" as const;

export const ADMIN_USERS_WRITE_ROUTE_CONTRACTS = [
  {
    futureRoute: "/api/admin/users/create-preview",
    futureMethod: "POST",
    futurePermission: "admin.users.manage",
    status: "planned-only",
    requiredGuardrails: [
      "authenticated admin session",
      "owner_admin effective permission required",
      "duplicate email check",
      "email normalization",
      "no enforcement change",
      "audit log required before write route activation",
    ],
  },
  {
    futureRoute: "/api/admin/users/assign-role-preview",
    futureMethod: "POST",
    futurePermission: "admin.users.manage",
    status: "planned-only",
    requiredGuardrails: [
      "authenticated admin session",
      "owner_admin effective permission required",
      "role must exist and be active",
      "preserve at least one active bootstrapSafe owner_admin user",
      "audit log required before write route activation",
    ],
  },
  {
    futureRoute: "/api/admin/users/remove-role-preview",
    futureMethod: "POST",
    futurePermission: "admin.users.manage",
    status: "planned-only",
    requiredGuardrails: [
      "authenticated admin session",
      "owner_admin effective permission required",
      "block removal if it would leave no active bootstrapSafe owner_admin user",
      "audit log required before write route activation",
    ],
  },
  {
    futureRoute: "/api/admin/users/permission-override-preview",
    futureMethod: "POST",
    futurePermission: "admin.users.manage",
    status: "planned-only",
    requiredGuardrails: [
      "authenticated admin session",
      "owner_admin effective permission required",
      "explicit reason required",
      "never permit blocking /admin exact safety route",
      "never permit blocking /admin/permissions",
      "never permit blocking /api/admin/permissions",
      "never permit blocking /api/admin/permissions/check",
      "enforcement remains disabled until a separate phase",
      "audit log required before write route activation",
    ],
  },
  {
    futureRoute: "/api/admin/users/enforcement-preview",
    futureMethod: "POST",
    futurePermission: "admin.users.manage",
    status: "not-available",
    requiredGuardrails: [
      "separate enforcement phase only",
      "full lockout simulation required",
      "bootstrap owner_admin must remain active",
      "never-block routes must remain hardcoded",
      "manual rollback instructions required",
    ],
  },
] as const;

export function adminUsersWriteContractPreview() {
  return {
    action: "admin-users-write-contract-preview",
    mode: ADMIN_USERS_WRITE_CONTRACT_MODE,
    activeWriteRoutes: false,
    writesDatabase: false,
    enablesEnforcement: false,
    contracts: ADMIN_USERS_WRITE_ROUTE_CONTRACTS,
  };
}
