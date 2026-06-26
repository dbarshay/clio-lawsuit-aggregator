import fs from "node:fs";

const page = fs.readFileSync("app/admin/users/page.tsx", "utf8");
const route = fs.readFileSync("app/api/admin/users/signer-profile/route.ts", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

for (const token of [
  "data-barsh-admin-users-edit-panel",
  "saveEditAdminUserPanel",
  "credentials: \"same-origin\"",
  "}, \"Save user\");",
  "Save user failed.",
  "/api/admin/users/signer-profile",
]) must(page.includes(token), "missing edit-save client token: " + token);

for (const token of [
  "action: \"admin-user-signer-profile-update\"",
  "mode: \"blocked\"",
  "Authenticated administrator session required.",
  "enforcementChanged: false",
  "isAdminRequestAuthorized(req)",
  "requireOwnerAdminActor(actorEmail)",
  "Only an active owner_admin user may edit admin signer profiles",
]) must(route.includes(token), "missing signer-profile auth token: " + token);

must(!route.includes('return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 })'), "ambiguous Unauthorized response must not remain.");

const tryIndex = route.indexOf("export async function PATCH");
const authIndex = route.indexOf("isAdminRequestAuthorized(req)", tryIndex);
const bodyIndex = route.indexOf("await req.json", tryIndex);
must(tryIndex >= 0 && authIndex > tryIndex && bodyIndex > authIndex, "signer-profile route must authorize before parsing/applying body.");

must(pkg.scripts?.["verify:admin-users-workflow-phase-j-edit-save-auth"] === "node scripts/verify-admin-users-workflow-phase-j-edit-save-auth.mjs", "package script missing");

if (failures.length) {
  console.error("FAIL: Admin Users Workflow Phase J edit-save auth verifier failed");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("PASS: Admin Users Workflow Phase J edit-save auth response locked.");
