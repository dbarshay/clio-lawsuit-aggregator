import fs from "node:fs";

const failures = [];
const read = (path) => fs.readFileSync(path, "utf8");
const has = (text, token) => text.includes(token);
const must = (ok, message) => {
  if (ok) console.log("PASS:", message);
  else {
    console.error("FAIL:", message);
    failures.push(message);
  }
};

const sourcePath = "src/lib/admin-users/admin-users-route-guard-package-phase-w9.ts";
const source = read(sourcePath);
const w8 = read("src/lib/admin-users/admin-users-permission-enforcement-phase-w8.ts");
const doc = read("docs/admin-users/admin-users-phase-w9-route-guard-package.md");
const proof = JSON.parse(read("docs/admin-users/admin-users-phase-w9-route-guard-package.json"));
const session = read("app/api/auth/session/route.ts");
const pkg = JSON.parse(read("package.json"));

const appFiles = [];
function walk(dir) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${item.name}`;
    if (item.isDirectory()) {
      if (!["node_modules", ".next", ".git"].includes(item.name)) walk(full);
    } else if (/\.(ts|tsx|mjs|js)$/.test(full)) {
      appFiles.push(full);
    }
  }
}
walk("app");

console.log("RUN: Admin Users Phase W9 route-guard package verifier");

must(has(source, "ADMIN_USERS_PHASE_W9_ROUTE_GUARD_PACKAGE"), "W9 package marker exists");
must(has(source, "adminUsersPhaseW9EvaluateRouteAccess"), "W9 route access evaluator exists");
must(has(source, "adminUsersPhaseW9BuildDenyMessage"), "W9 deny message helper exists");
must(has(source, "adminUsersPhaseW9ActivationPreflight"), "W9 activation preflight exists");
must(has(source, "adminUsersPhaseW8DryRunDecision"), "W9 wraps W8 dry-run decision");
must(has(source, "routeGuardWired: false"), "W9 source says guard is not wired");
must(has(source, "responseBlockingImplemented: false"), "W9 source says response blocking not implemented");
must(has(source, "routeBlockingActive: false"), "W9 source keeps route blocking inactive");
must(has(source, "uiHidingActive: false"), "W9 source keeps UI hiding inactive");
must(has(source, "databaseMutated: false"), "W9 source records no DB mutation");
must(has(source, "safeToActivateInW9: false"), "W9 source says not safe to activate in W9");
must(has(source, "ownerNoLockoutRequired: true"), "W9 source requires owner no-lockout proof");
must(has(source, "rollbackRequired: true"), "W9 source requires rollback");

must(has(w8, "BARSH_ADMIN_USERS_PERMISSION_ENFORCEMENT"), "W8 kill switch remains present");

const routeImports = appFiles.filter((file) => read(file).includes("admin-users-route-guard-package-phase-w9"));
must(routeImports.length === 0, "W9 guard package is not imported by app routes/pages");

must(proof.phase === "admin-users-phase-w9-route-guard-package", "proof phase is W9");
must(proof.basedOnPhaseW8 === "admin-users-phase-w8-enforcement-kill-switch-scaffold", "proof is based on W8");
must(proof.runtimeEnforcementChanged === false, "proof says runtime enforcement unchanged");
must(proof.routeGuardWired === false, "proof says guard not wired");
must(proof.responseBlockingImplemented === false, "proof says response blocking not implemented");
must(proof.routeBlockingActive === false, "proof says route blocking inactive");
must(proof.uiHidingActive === false, "proof says UI hiding inactive");
must(proof.databaseMutated === false, "proof says database not mutated");
must(proof.sessionModeChanged === false, "proof says session mode unchanged");
must(proof.guardPackageReady === true, "proof says guard package ready");
must(proof.safeToActivateInW9 === false, "proof says not safe to activate in W9");
must(proof.rollbackPlanDocumented === true, "proof says rollback plan documented");
must(proof.killSwitchEnvKey === "BARSH_ADMIN_USERS_PERMISSION_ENFORCEMENT", "proof records kill-switch env key");

must(has(doc, "package only"), "doc marks package only");
must(has(doc, "No route imports or calls the W9 guard"), "doc says no route wiring");
must(has(doc, "No runtime enforcement is enabled"), "doc says runtime enforcement disabled");
must(has(doc, "No response blocking is implemented"), "doc says no response blocking");
must(has(doc, "No UI hiding is enabled"), "doc says no UI hiding");
must(has(doc, "No database changes are made"), "doc says no database changes");
must(has(doc, "Owner no-lockout smoke proof"), "doc requires owner no-lockout proof");
must(has(doc, "BARSH_ADMIN_USERS_PERMISSION_ENFORCEMENT"), "doc includes rollback kill switch");
must(has(doc, "Reverting the route wiring commit"), "doc includes route wiring rollback");

must(has(session, 'permissionsMode: "default-admin-allow-all"'), "session remains default-admin-allow-all");
must(pkg.scripts?.["verify:admin-users-phase-w9-route-guard-package"] === "node scripts/verify-admin-users-phase-w9-route-guard-package.mjs", "package verifier script registered");

if (failures.length) {
  console.error("");
  console.error("FAILURES=" + failures.length);
  process.exit(1);
}

console.log("FAILURES=0");
console.log("PASS: Admin Users Phase W9 route-guard package is verifier-locked without route wiring.");
