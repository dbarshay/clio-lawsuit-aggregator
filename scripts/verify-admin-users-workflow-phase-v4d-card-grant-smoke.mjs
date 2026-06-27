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

const smoke = read("scripts/smoke-admin-users-phase-v4d-card-grants.mjs");
const route = read("app/api/admin/users/card-grants/route.ts");
const planning = read("app/api/admin/users/planning/route.ts");
const page = read("app/admin/users/page.tsx");
const session = read("app/api/auth/session/route.ts");
const doc = read("docs/admin-users/admin-users-phase-v4d-card-grant-smoke.md");
const proof = JSON.parse(read("docs/admin-users/admin-users-phase-v4d-card-grant-smoke.json"));
const pkg = JSON.parse(read("package.json"));

console.log("RUN: Admin Users Phase V4D card-grant smoke verifier");

must(has(smoke, "PHASE_V4D_ENV_FILES_LOADED"), "smoke loads env files without printing secrets");
must(has(smoke, "APPLY_FLAG"), "smoke has explicit apply flag");
must(has(smoke, "--apply-admin-users-phase-v4d-card-grant-smoke"), "smoke apply flag is correct");
must(has(smoke, "PREVIEW_ONLY=true"), "smoke supports preview mode");
must(has(smoke, 'TEST_EMAIL = "jane.doe.limited@example.com"'), "smoke targets Jane Doe test user");
must(has(smoke, 'ADMINISTRATOR_ROLE_KEY = "administrator"'), "smoke uses administrator role");
must(has(smoke, "adminUserRole.upsert"), "smoke assigns administrator role by upsert");
must(has(smoke, "adminUserPermissionOverride.upsert"), "smoke saves card grants by upsert");
must(has(smoke, "admin.card.auditHistory"), "smoke includes audit history grant");
must(has(smoke, "admin.card.documentTemplates"), "smoke includes document templates grant");
must(has(smoke, "admin.card.referenceData"), "smoke includes reference data grant");
must(has(smoke, "changesPermissionEnforcement: false"), "smoke declares enforcement unchanged");
must(has(smoke, "changesTwoFactor: false"), "smoke declares 2FA unchanged");
must(has(smoke, "changesPasswords: false"), "smoke declares passwords unchanged");
must(has(smoke, "changesSessions: false"), "smoke declares sessions unchanged");
must(!has(smoke, "adminUser.create"), "smoke does not create users");
must(!has(smoke, "adminUser.delete"), "smoke does not delete users");
must(!has(smoke, "adminRole.delete"), "smoke does not delete roles");

must(has(route, 'action: "admin-user-card-grants"'), "V4B route remains present");
must(has(planning, "adminCardGrantKeys"), "planning route exposes saved grants");
must(has(page, "Save Card Grants"), "V4C UI remains wired");
must(has(doc, "guarded DB smoke test"), "doc marks guarded smoke test");
must(proof.runtimeEnforcementChanged === false, "proof says runtime enforcement unchanged");
must(proof.sessionBehaviorChanged === false, "proof says session unchanged");
must(proof.testEmail === "jane.doe.limited@example.com", "proof targets Jane Doe");
must(proof.grantPermissionKeys.includes("admin.card.auditHistory"), "proof includes audit history grant");
must(proof.grantPermissionKeys.includes("admin.card.documentTemplates"), "proof includes document templates grant");
must(proof.grantPermissionKeys.includes("admin.card.referenceData"), "proof includes reference data grant");
must(has(session, 'permissionsMode: "default-admin-allow-all"'), "session remains default-admin-allow-all");
must(pkg.scripts?.["smoke:admin-users-phase-v4d-card-grants"] === "node scripts/smoke-admin-users-phase-v4d-card-grants.mjs", "package smoke script registered");
must(pkg.scripts?.["verify:admin-users-workflow-phase-v4d-card-grant-smoke"] === "node scripts/verify-admin-users-workflow-phase-v4d-card-grant-smoke.mjs", "package verifier script registered");

if (failures.length) {
  console.error("");
  console.error("FAILURES=" + failures.length);
  process.exit(1);
}

console.log("FAILURES=0");
console.log("PASS: Admin Users Phase V4D card-grant smoke is verifier-locked without runtime enforcement changes.");
