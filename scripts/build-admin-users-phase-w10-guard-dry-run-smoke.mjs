import fs from "node:fs";

const w2 = JSON.parse(fs.readFileSync("docs/admin-users/admin-users-phase-w2-route-action-classification.json", "utf8"));

const mutationOps = [
  "create",
  "edit",
  "delete",
  "archive",
  "generate",
  "finalize",
  "upload",
  "email",
  "run",
  "void",
  "payment_manage",
  "admin_manage",
];

const actors = [
  {
    actorKey: "owner",
    displayName: "Owner",
    roleKeys: ["owner_admin"],
    adminCardGrantKeys: [],
  },
  {
    actorKey: "administrator-selected",
    displayName: "Administrator with selected cards",
    roleKeys: ["administrator"],
    adminCardGrantKeys: ["admin.card.clientsBilling", "admin.card.documentTemplates", "admin.card.ticklers"],
  },
  {
    actorKey: "full-user",
    displayName: "Full User",
    roleKeys: ["full_user"],
    adminCardGrantKeys: [],
  },
  {
    actorKey: "basic-user",
    displayName: "Basic User",
    roleKeys: ["basic_user"],
    adminCardGrantKeys: [],
  },
  {
    actorKey: "view-only",
    displayName: "View Only",
    roleKeys: ["view_only"],
    adminCardGrantKeys: [],
  },
];

function classify(path) {
  const row = w2.classifications.find((item) => item.path === path);
  if (!row) throw new Error(`Missing classified route: ${path}`);
  return row;
}

function hasMutation(row) {
  return (row.operationFamilies || []).some((op) => mutationOps.includes(op));
}

function pickRoute(predicate, description) {
  const row = w2.classifications.find(predicate);
  if (!row) throw new Error(`Could not find stable route for ${description}`);
  return row.path;
}

const stableRoutes = {
  adminUsers: "app/admin/users/page.tsx",
  documentTemplates: "app/admin/document-templates/page.tsx",
  nonAdminPayment: pickRoute(
    (row) => !row.adminOnly && row.paymentSensitive === true,
    "non-admin payment-sensitive route"
  ),
  nonAdminReadOnly: pickRoute(
    (row) =>
      !row.adminOnly &&
      row.paymentSensitive === false &&
      row.operationFamilies.length === 1 &&
      row.operationFamilies.includes("view"),
    "non-admin read-only route"
  ),
  nonAdminMutation: pickRoute(
    (row) =>
      !row.adminOnly &&
      hasMutation(row) &&
      row.operationFamilies.some((operation) =>
        ["edit", "create", "run", "generate", "finalize", "upload", "email", "void", "payment_manage"].includes(operation)
      ),
    "non-admin mutation/action route"
  ),
};

function decision(actor, row, killSwitchEnabled) {
  if (!killSwitchEnabled) {
    return {
      allowed: true,
      reason: "Permission enforcement kill switch is off; this helper is dry-run only and must not block.",
      enforcementActive: false,
      killSwitchEnabled,
      dryRunOnly: true,
      routeBlockingActive: false,
      uiHidingActive: false,
      databaseMutated: false,
    };
  }

  if (actor.roleKeys.includes("owner_admin")) {
    return {
      allowed: true,
      reason: "Owner is allowed everything and remains protected from lockout.",
      enforcementActive: true,
      killSwitchEnabled,
      dryRunOnly: true,
      routeBlockingActive: false,
      uiHidingActive: false,
      databaseMutated: false,
    };
  }

  if (row.adminOnly) {
    if (!actor.roleKeys.includes("administrator")) {
      return {
        allowed: false,
        reason: "Dry-run decision: non-admin role would be blocked from Admin-only route.",
        enforcementActive: true,
        killSwitchEnabled,
        dryRunOnly: true,
        routeBlockingActive: false,
        uiHidingActive: false,
        databaseMutated: false,
      };
    }

    if (row.adminCardGrantKey && !actor.adminCardGrantKeys.includes(row.adminCardGrantKey)) {
      return {
        allowed: false,
        reason: "Dry-run decision: Administrator lacks selected Admin-card grant.",
        enforcementActive: true,
        killSwitchEnabled,
        dryRunOnly: true,
        routeBlockingActive: false,
        uiHidingActive: false,
        databaseMutated: false,
      };
    }

    return {
      allowed: true,
      reason: "Dry-run decision: Administrator has Admin route/card access.",
      enforcementActive: true,
      killSwitchEnabled,
      dryRunOnly: true,
      routeBlockingActive: false,
      uiHidingActive: false,
      databaseMutated: false,
    };
  }

  if (actor.roleKeys.includes("administrator") || actor.roleKeys.includes("full_user")) {
    return {
      allowed: true,
      reason: "Dry-run decision: role allows non-admin access.",
      enforcementActive: true,
      killSwitchEnabled,
      dryRunOnly: true,
      routeBlockingActive: false,
      uiHidingActive: false,
      databaseMutated: false,
    };
  }

  if (actor.roleKeys.includes("basic_user")) {
    const blocked = row.paymentSensitive || (row.operationFamilies || []).includes("payment_manage") || (row.operationFamilies || []).includes("void");
    return {
      allowed: !blocked,
      reason: blocked
        ? "Dry-run decision: Basic User would be blocked from payment/billing/void route."
        : "Dry-run decision: Basic User would be allowed non-payment non-admin route.",
      enforcementActive: true,
      killSwitchEnabled,
      dryRunOnly: true,
      routeBlockingActive: false,
      uiHidingActive: false,
      databaseMutated: false,
    };
  }

  if (actor.roleKeys.includes("view_only")) {
    const blocked = row.paymentSensitive || hasMutation(row);
    return {
      allowed: !blocked,
      reason: blocked
        ? "Dry-run decision: View Only would be blocked from payment or mutation/action route."
        : "Dry-run decision: View Only would be allowed read-only non-admin route.",
      enforcementActive: true,
      killSwitchEnabled,
      dryRunOnly: true,
      routeBlockingActive: false,
      uiHidingActive: false,
      databaseMutated: false,
    };
  }

  return {
    allowed: false,
    reason: "Dry-run decision: no recognized role allowed this route.",
    enforcementActive: true,
    killSwitchEnabled,
    dryRunOnly: true,
    routeBlockingActive: false,
    uiHidingActive: false,
    databaseMutated: false,
  };
}

const scenarios = [
  {
    scenarioKey: "kill-switch-off-allows-basic-admin-route",
    actorKey: "basic-user",
    routePath: stableRoutes.adminUsers,
    killSwitchEnabled: false,
    expectedAllowed: true,
  },
  {
    scenarioKey: "owner-admin-users-allowed",
    actorKey: "owner",
    routePath: stableRoutes.adminUsers,
    killSwitchEnabled: true,
    expectedAllowed: true,
  },
  {
    scenarioKey: "administrator-selected-card-allowed",
    actorKey: "administrator-selected",
    routePath: stableRoutes.documentTemplates,
    killSwitchEnabled: true,
    expectedAllowed: true,
  },
  {
    scenarioKey: "administrator-unselected-card-blocked",
    actorKey: "administrator-selected",
    routePath: stableRoutes.adminUsers,
    killSwitchEnabled: true,
    expectedAllowed: false,
  },
  {
    scenarioKey: "full-user-admin-blocked",
    actorKey: "full-user",
    routePath: stableRoutes.adminUsers,
    killSwitchEnabled: true,
    expectedAllowed: false,
  },
  {
    scenarioKey: "full-user-non-admin-payment-allowed",
    actorKey: "full-user",
    routePath: stableRoutes.nonAdminPayment,
    killSwitchEnabled: true,
    expectedAllowed: true,
  },
  {
    scenarioKey: "basic-user-payment-blocked",
    actorKey: "basic-user",
    routePath: stableRoutes.nonAdminPayment,
    killSwitchEnabled: true,
    expectedAllowed: false,
  },
  {
    scenarioKey: "basic-user-non-payment-view-allowed",
    actorKey: "basic-user",
    routePath: stableRoutes.nonAdminReadOnly,
    killSwitchEnabled: true,
    expectedAllowed: true,
  },
  {
    scenarioKey: "view-only-read-allowed",
    actorKey: "view-only",
    routePath: stableRoutes.nonAdminReadOnly,
    killSwitchEnabled: true,
    expectedAllowed: true,
  },
  {
    scenarioKey: "view-only-mutation-blocked",
    actorKey: "view-only",
    routePath: stableRoutes.nonAdminMutation,
    killSwitchEnabled: true,
    expectedAllowed: false,
  },
];

const results = scenarios.map((scenario) => {
  const actor = actors.find((item) => item.actorKey === scenario.actorKey);
  const route = classify(scenario.routePath);
  const result = decision(actor, route, scenario.killSwitchEnabled);
  return {
    ...scenario,
    actualAllowed: result.allowed,
    pass: result.allowed === scenario.expectedAllowed,
    reason: result.reason,
    routeContext: {
      path: route.path,
      areaKey: route.areaKey,
      operationFamilies: route.operationFamilies,
      paymentSensitive: route.paymentSensitive,
      adminOnly: route.adminOnly,
      adminCardGrantKey: route.adminCardGrantKey,
    },
    result,
  };
});

const payload = {
  phase: "admin-users-phase-w10-guard-dry-run-smoke",
  basedOnPhaseW9: "admin-users-phase-w9-route-guard-package",
  runtimeEnforcementChanged: false,
  routeGuardWired: false,
  responseBlockingImplemented: false,
  routeBlockingActive: false,
  uiHidingActive: false,
  databaseMutated: false,
  sessionModeChanged: false,
  dryRunOnly: true,
  scenarioCount: scenarios.length,
  passCount: results.filter((row) => row.pass).length,
  failCount: results.filter((row) => !row.pass).length,
  stableRoutes,
  results,
};

fs.writeFileSync("docs/admin-users/admin-users-phase-w10-guard-dry-run-smoke.json", JSON.stringify(payload, null, 2) + "\n");

const md = [
  "# Admin Users Phase W10 - Guard Dry-Run Smoke Tests",
  "",
  "Status: dry-run smoke only.",
  "",
  "No route imports or calls the W9 guard.",
  "No runtime enforcement is enabled.",
  "No response blocking is implemented.",
  "No UI hiding is enabled.",
  "No database changes are made.",
  "No session mode is changed.",
  "",
  `Scenarios: ${payload.scenarioCount}`,
  `Passed: ${payload.passCount}`,
  `Failed: ${payload.failCount}`,
  "",
  "## Stable routes selected from W2",
  "",
  `- Admin Users: ${stableRoutes.adminUsers}`,
  `- Document Templates: ${stableRoutes.documentTemplates}`,
  `- Non-admin payment: ${stableRoutes.nonAdminPayment}`,
  `- Non-admin read-only: ${stableRoutes.nonAdminReadOnly}`,
  `- Non-admin mutation/action: ${stableRoutes.nonAdminMutation}`,
  "",
  "## Scenario results",
  "",
  "| Scenario | Actor | Route | Expected | Actual | Pass |",
  "|---|---|---|---:|---:|---:|",
  ...results.map((row) => `| ${row.scenarioKey} | ${row.actorKey} | ${row.routePath} | ${row.expectedAllowed} | ${row.actualAllowed} | ${row.pass} |`),
  "",
  "## Next phase",
  "",
  "Phase W11 should add a route-wiring candidate list and activation checklist. It should still not wire the guard into routes.",
  "",
].join("\n");

fs.writeFileSync("docs/admin-users/admin-users-phase-w10-guard-dry-run-smoke.md", md);

console.log(JSON.stringify({
  phase: payload.phase,
  scenarioCount: payload.scenarioCount,
  passCount: payload.passCount,
  failCount: payload.failCount,
  runtimeEnforcementChanged: payload.runtimeEnforcementChanged,
  routeGuardWired: payload.routeGuardWired,
  routeBlockingActive: payload.routeBlockingActive,
  uiHidingActive: payload.uiHidingActive,
  databaseMutated: payload.databaseMutated,
  stableRoutes,
}, null, 2));

if (payload.failCount !== 0) {
  console.error("FAILED_SCENARIOS=" + JSON.stringify(results.filter((row) => !row.pass), null, 2));
  process.exit(1);
}
