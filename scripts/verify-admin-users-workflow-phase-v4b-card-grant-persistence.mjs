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

const route = read("app/api/admin/users/card-grants/route.ts");
const planning = read("app/api/admin/users/planning/route.ts");
const roleModel = read("src/lib/admin-users/admin-users-final-role-model-phase-v1.ts");
const session = read("app/api/auth/session/route.ts");
const doc = read("docs/admin-users/admin-users-phase-v4b-card-grant-persistence.md");
const proof = JSON.parse(read("docs/admin-users/admin-users-phase-v4b-card-grant-persistence.json"));
const pkg = JSON.parse(read("package.json"));

console.log("RUN: Admin Users Phase V4B card-grant persistence verifier");

must(has(route, 'action: "admin-user-card-grants"'), "card-grants route action present");
must(has(route, "isAdminRequestAuthorized"), "card-grants route requires authenticated admin session");
must(has(route, "activeOwnerAdminActor"), "card-grants route verifies active owner_admin actor");
must(has(route, 'key: "owner_admin"'), "card-grants route checks owner_admin actor role");
must(has(route, 'targetRoleKeys.includes("administrator")'), "card-grants route requires target administrator role");
must(has(route, 'targetRoleKeys.includes("owner_admin")'), "card-grants route blocks owner per-card grants");
must(has(route, "ADMIN_USERS_PHASE_V1_ADMIN_CARDS"), "card-grants route uses canonical admin cards");
must(has(route, "ADMIN_CARD_GRANT_KEY_SET"), "card-grants route validates admin-card grant keys");
must(has(route, "invalidGrantKeys"), "card-grants route rejects invalid grant keys");
must(has(route, "adminUserPermissionOverride.upsert"), "card-grants route upserts allow overrides");
must(has(route, "adminUserPermissionOverride.deleteMany"), "card-grants route removes deselected allow overrides");
must(has(route, 'action: "allow"'), "card-grants route persists allow actions");
must(has(route, "createMatterAuditLogEntry"), "card-grants route audit logs apply operations");
must(has(route, "previewOnly: true"), "card-grants route supports preview mode");
must(has(route, "enforcementChanged: false"), "card-grants route declares enforcement unchanged");
must(has(route, "runtimeEnforcementChanged: false"), "card-grants route declares runtime enforcement unchanged");
must(has(route, "sessionBehaviorChanged: false"), "card-grants route declares session unchanged");
must(!has(route, "adminUser.create"), "card-grants route does not create users");
must(!has(route, "adminUser.delete"), "card-grants route does not delete users");
must(!has(route, "adminUserRole.create"), "card-grants route does not assign roles");
must(!has(route, "adminUserRole.delete"), "card-grants route does not remove roles");

for (const key of [
  "admin.card.usersRoles",
  "admin.card.permissionsReview",
  "admin.card.auditHistory",
  "admin.card.documentTemplates",
  "admin.card.referenceData",
  "admin.card.claimIndex",
  "admin.card.ticklers",
  "admin.card.clientsBilling",
  "admin.card.backupRestore",
  "admin.card.readinessDashboard",
  "admin.card.documentReadiness",
  "admin.card.lawsuitCleanup",
]) {
  must(has(roleModel, key), `role model includes admin card grant key: ${key}`);
}

must(has(planning, "adminCardGrantKeys"), "planning route exposes saved adminCardGrantKeys");
must(has(planning, "adminCardBlockKeys"), "planning route exposes adminCardBlockKeys");
must(has(planning, "adminCardGrantPersistenceMode"), "planning route exposes grant persistence mode");
must(has(planning, "ADMIN_USERS_PHASE_V4B_ADMIN_CARD_GRANT_KEY_SET"), "planning route filters canonical admin-card keys");
must(has(doc, "guarded persistence route and read model only"), "doc marks guarded persistence/read-model status");
must(proof.runtimeEnforcementChanged === false, "proof says runtime enforcement unchanged");
must(proof.sessionBehaviorChanged === false, "proof says session unchanged");
must(proof.route === "/api/admin/users/card-grants", "proof route is card-grants");
must(proof.actorRoleRequired === "owner_admin", "proof requires owner_admin actor");
must(proof.targetRoleRequired === "administrator", "proof requires administrator target");
must(has(session, 'permissionsMode: "default-admin-allow-all"'), "session remains default-admin-allow-all");
must(pkg.scripts?.["verify:admin-users-workflow-phase-v4b-card-grant-persistence"] === "node scripts/verify-admin-users-workflow-phase-v4b-card-grant-persistence.mjs", "package verifier script registered");

if (failures.length) {
  console.error("");
  console.error("FAILURES=" + failures.length);
  process.exit(1);
}

console.log("FAILURES=0");
console.log("PASS: Admin Users Phase V4B card-grant persistence is verifier-locked without runtime enforcement changes.");
