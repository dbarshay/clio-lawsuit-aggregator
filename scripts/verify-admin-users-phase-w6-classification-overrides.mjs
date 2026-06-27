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

const source = read("src/lib/admin-users/admin-users-classification-overrides-phase-w6.ts");
const builder = read("scripts/build-admin-users-phase-w6-classification-overrides.mjs");
const doc = read("docs/admin-users/admin-users-phase-w6-classification-overrides.md");
const proof = JSON.parse(read("docs/admin-users/admin-users-phase-w6-classification-overrides.json"));
const w5 = JSON.parse(read("docs/admin-users/admin-users-phase-w5-classification-review.json"));
const session = read("app/api/auth/session/route.ts");
const pkg = JSON.parse(read("package.json"));

console.log("RUN: Admin Users Phase W6 classification overrides verifier");

must(has(source, "ADMIN_USERS_PHASE_W6_CLASSIFICATION_OVERRIDES"), "W6 override marker exists");
must(has(source, "ADMIN_USERS_PHASE_W6_CLASSIFICATION_OVERRIDES_LIST"), "W6 override list exists");
must(has(source, "adminUsersPhaseW6OverrideByPath"), "W6 lookup helper exists");
must(has(source, "enforcementActive: false"), "W6 source keeps enforcement inactive");
must(has(source, "uiHidingActive: false"), "W6 source keeps UI hiding inactive");

for (const disposition of ["admin_card_mapping", "read_only_preview", "payment_sensitive", "financial_settlement_sensitive", "admin_context_only"]) {
  must(has(source, disposition), `W6 source includes disposition ${disposition}`);
  must(Object.prototype.hasOwnProperty.call(proof.byReviewedDisposition, disposition), `W6 proof counts disposition ${disposition}`);
}

for (const grantKey of [
  "admin.card.auditHistory",
  "admin.card.readinessDashboard"
]) {
  must(has(source, grantKey), `W6 source includes admin grant mapping ${grantKey}`);
}

for (const path of [
  "app/admin/audit-history/page.tsx",
  "app/admin/clients/page.tsx",
  "app/api/admin/clients/route.ts",
  "app/api/settlements/attorney-fee-breakdown/route.ts",
  "app/api/documents/generate-preview/route.ts",
  "app/api/settlements/writeback-preview/route.ts"
]) {
  must(has(source, `path: "${path}"`), `W6 source includes override path ${path}`);
  must(proof.overrides.some((row) => row.path === path), `W6 proof includes override path ${path}`);
}

must(proof.phase === "admin-users-phase-w6-classification-overrides", "proof phase is W6");
must(proof.basedOnPhaseW5 === w5.phase, "proof is based on W5");
must(proof.runtimeEnforcementChanged === false, "proof says runtime enforcement unchanged");
must(proof.uiHidingActive === false, "proof says UI hiding inactive");
must(proof.backendRouteBlockingActive === false, "proof says backend route blocking inactive");
must(proof.databaseMutated === false, "proof says database not mutated");
must(proof.overridePlanOnly === true, "proof says override plan only");
must(Number.isInteger(proof.overrideCount) && proof.overrideCount > 0, "proof has planned overrides");
must(Array.isArray(proof.overrides) && proof.overrides.length === proof.overrideCount, "proof override count matches overrides array");
must(proof.overrideCount <= w5.issueCount, "W6 planned overrides do not exceed W5 issue count");

must(has(builder, "overridePlanOnly: true"), "builder records override-plan-only");
must(has(builder, "runtimeEnforcementChanged: false"), "builder keeps runtime enforcement unchanged");
must(has(builder, "uiHidingActive: false"), "builder keeps UI hiding inactive");
must(has(builder, "backendRouteBlockingActive: false"), "builder keeps backend route blocking inactive");
must(has(builder, "databaseMutated: false"), "builder records no DB mutation");

must(has(doc, "override plan only"), "doc marks override plan only");
must(has(doc, "No runtime enforcement is enabled"), "doc says runtime enforcement disabled");
must(has(doc, "No UI hiding is enabled"), "doc says UI hiding disabled");
must(has(doc, "No backend route blocking is enabled"), "doc says backend blocking disabled");
must(has(doc, "No database changes are made"), "doc says database unchanged");
must(has(doc, "Phase W7 should apply these overrides"), "doc points next to W7 apply/rebuild");

must(has(session, 'permissionsMode: "default-admin-allow-all"'), "session remains default-admin-allow-all");
must(pkg.scripts?.["build:admin-users-phase-w6-classification-overrides"] === "node scripts/build-admin-users-phase-w6-classification-overrides.mjs", "package build script registered");
must(pkg.scripts?.["verify:admin-users-phase-w6-classification-overrides"] === "node scripts/verify-admin-users-phase-w6-classification-overrides.mjs", "package verifier script registered");

if (failures.length) {
  console.error("");
  console.error("FAILURES=" + failures.length);
  process.exit(1);
}

console.log("FAILURES=0");
console.log("PASS: Admin Users Phase W6 explicit classification override plan is verifier-locked without enforcement.");
