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

const builder = read("scripts/build-admin-users-phase-w10-guard-dry-run-smoke.mjs");
const doc = read("docs/admin-users/admin-users-phase-w10-guard-dry-run-smoke.md");
const proof = JSON.parse(read("docs/admin-users/admin-users-phase-w10-guard-dry-run-smoke.json"));
const w9 = read("src/lib/admin-users/admin-users-route-guard-package-phase-w9.ts");
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

console.log("RUN: Admin Users Phase W10 guard dry-run smoke verifier");

for (const key of [
  "kill-switch-off-allows-basic-admin-route",
  "owner-admin-users-allowed",
  "administrator-selected-card-allowed",
  "administrator-unselected-card-blocked",
  "full-user-admin-blocked",
  "full-user-non-admin-payment-allowed",
  "basic-user-payment-blocked",
  "basic-user-non-payment-view-allowed",
  "view-only-read-allowed",
  "view-only-mutation-blocked"
]) {
  must(has(builder, key), `builder includes scenario ${key}`);
}

must(has(builder, "stableRoutes"), "builder derives stable routes from W2 classification");
must(has(w9, "adminUsersPhaseW9EvaluateRouteAccess"), "W9 guard package remains present");
const routeImports = appFiles.filter((file) => read(file).includes("admin-users-route-guard-package-phase-w9"));
must(routeImports.length === 0, "W9 guard package remains not imported by app routes/pages");

must(proof.phase === "admin-users-phase-w10-guard-dry-run-smoke", "proof phase is W10");
must(proof.basedOnPhaseW9 === "admin-users-phase-w9-route-guard-package", "proof is based on W9");
must(proof.runtimeEnforcementChanged === false, "proof says runtime enforcement unchanged");
must(proof.routeGuardWired === false, "proof says route guard not wired");
must(proof.responseBlockingImplemented === false, "proof says response blocking not implemented");
must(proof.routeBlockingActive === false, "proof says route blocking inactive");
must(proof.uiHidingActive === false, "proof says UI hiding inactive");
must(proof.databaseMutated === false, "proof says database not mutated");
must(proof.sessionModeChanged === false, "proof says session mode unchanged");
must(proof.dryRunOnly === true, "proof says dry-run only");
must(proof.scenarioCount === 10, "proof has ten smoke scenarios");
must(proof.passCount === 10, "proof has ten passing scenarios");
must(proof.failCount === 0, "proof has zero failing scenarios");
must(Boolean(proof.stableRoutes?.nonAdminReadOnly), "proof records selected read-only route");
must(Boolean(proof.stableRoutes?.nonAdminMutation), "proof records selected mutation route");
must(Array.isArray(proof.results) && proof.results.length === proof.scenarioCount, "proof result count matches scenario count");

for (const result of proof.results) {
  must(result.pass === true, `scenario passed: ${result.scenarioKey}`);
  must(result.result?.dryRunOnly === true, `scenario dry-run only: ${result.scenarioKey}`);
  must(result.result?.routeBlockingActive === false, `scenario route blocking inactive: ${result.scenarioKey}`);
  must(result.result?.uiHidingActive === false, `scenario UI hiding inactive: ${result.scenarioKey}`);
  must(result.result?.databaseMutated === false, `scenario database unchanged: ${result.scenarioKey}`);
}

must(has(doc, "dry-run smoke only"), "doc marks dry-run smoke only");
must(has(doc, "No route imports or calls the W9 guard"), "doc says no route wiring");
must(has(doc, "No runtime enforcement is enabled"), "doc says runtime enforcement disabled");
must(has(doc, "No response blocking is implemented"), "doc says response blocking disabled");
must(has(doc, "No UI hiding is enabled"), "doc says UI hiding disabled");
must(has(doc, "No database changes are made"), "doc says database unchanged");
must(has(doc, "Phase W11 should add a route-wiring candidate list"), "doc points next to W11 candidate list");

must(has(session, 'permissionsMode: "default-admin-allow-all"'), "session remains default-admin-allow-all");
must(pkg.scripts?.["build:admin-users-phase-w10-guard-dry-run-smoke"] === "node scripts/build-admin-users-phase-w10-guard-dry-run-smoke.mjs", "package build script registered");
must(pkg.scripts?.["verify:admin-users-phase-w10-guard-dry-run-smoke"] === "node scripts/verify-admin-users-phase-w10-guard-dry-run-smoke.mjs", "package verifier script registered");

if (failures.length) {
  console.error("");
  console.error("FAILURES=" + failures.length);
  process.exit(1);
}

console.log("FAILURES=0");
console.log("PASS: Admin Users Phase W10 guard dry-run smoke tests are verifier-locked without route wiring.");
