#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function pass(name) {
  console.log(`PASS: ${name}`);
}

function fail(name, detail) {
  console.error(`FAIL: ${name}`);
  if (detail) console.error(detail);
  process.exitCode = 1;
}

function assert(name, condition, detail) {
  if (condition) pass(name);
  else fail(name, detail);
}

console.log("RUN: Phase 12C passive auth identity diagnostics safety verifier");
console.log("Verifier-only: validates diagnostics are passive and do not alter authorization, login, or enforcement.");

const adminAuth = read("lib/adminAuth.ts");
const login = read("app/api/auth/login/route.ts");
const logout = read("app/api/auth/logout/route.ts");
const session = read("app/api/auth/session/route.ts");
const authorize = read("app/api/admin/authorize/route.ts");
const permissions = read("lib/adminPermissions.ts");
const phase12b = read("scripts/verify-admin-users-phase12b-auth-identity-planning-safety.cjs");
const packageJson = read("package.json");

assert("existing generic admin gate cookie name remains unchanged", adminAuth.includes('ADMIN_COOKIE_NAME = "barsh_admin_gate"'));
assert("new passive identity cookie name is separate from gate cookie", adminAuth.includes('ADMIN_IDENTITY_COOKIE_NAME = "barsh_admin_identity"'));
assert("authorization still depends on generic admin gate token equality only", adminAuth.includes("actualToken === expectedToken"));
assert("setAdminGateCookie still writes only ADMIN_COOKIE_NAME", adminAuth.includes("response.cookies.set(ADMIN_COOKIE_NAME, sessionToken"));
assert("setAdminGateCookie does not write identity cookie", !/setAdminGateCookie[\s\S]*ADMIN_IDENTITY_COOKIE_NAME[\s\S]*response\.cookies\.set/.test(adminAuth));
assert("logout still clears generic gate cookie", logout.includes("clearAdminGateCookie(response)"));
assert("login remains password-only", login.includes("const password = cleanAdminAuthValue(body?.password)") && !/body\?\.(email|adminEmail|userEmail)/.test(login));
assert("login still sets generic admin gate cookie only", login.includes("setAdminGateCookie(response)") && !login.includes("ADMIN_IDENTITY_COOKIE_NAME"));
assert("authorize remains password-only and generic", authorize.includes("setAdminGateCookie(response)") && !/body\?\.(email|adminEmail|userEmail)/.test(authorize));
assert("passive identity diagnostics type exists", adminAuth.includes("export type AdminSessionIdentityDiagnostics"));
assert("passive diagnostics helper exists", adminAuth.includes("export function adminSessionIdentityDiagnostics"));
assert("passive diagnostics expose identityBound false when no email is present", adminAuth.includes("legacyGenericAdminSession") && adminAuth.includes("Current authenticated admin session remains generic"));
assert("session imports passive diagnostics", session.includes("adminSessionIdentityDiagnostics"));
assert("session response exposes identityDiagnostics", session.includes("identityDiagnostics,"));
assert("session still computes authenticated from isAdminRequestAuthorized", session.includes("const authenticated = isAdminRequestAuthorized(req);"));
assert("session still grants all permissions to authenticated generic admin session", session.includes("const permissions = authenticated ? allAdminPermissionKeys() : []"));
assert("session still uses default-admin-allow-all mode", session.includes('permissionsMode: "default-admin-allow-all"'));
assert("session user exposes identityBound diagnostically only", session.includes("identityBound: identityDiagnostics.identityBound"));
assert("session route still does not query AdminUser table", !/prisma\.adminUser|adminUser\.find/i.test(session));
assert("permission never-block paths remain hardcoded", permissions.includes('"/admin"') && permissions.includes('"/admin/permissions"') && permissions.includes('"/api/admin/permissions"') && permissions.includes('"/api/admin/permissions/check"'));
assert("Phase 12B no-DB source contract remains present", phase12b.includes("Phase 12B is intentionally source/verifier-only and avoids live DB access."));
assert("package script registered for Phase 12C", packageJson.includes("verify:admin-users-phase12c-passive-auth-identity-diagnostics-safety"));

console.log("CONTRACT: Phase 12C is passive diagnostics only.");
console.log("CONTRACT: No AdminUser.email is trusted for enforcement in Phase 12C.");
console.log("CONTRACT: Owner/admin generic login remains intact.");
console.log("CONTRACT: Jane Doe limitations remain unenforced until a later phase proves session-bound AdminUser.email identity.");

if (process.exitCode) process.exit(process.exitCode);
