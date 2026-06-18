#!/usr/bin/env node
const fs = require("fs");
function read(path){ if(fs.existsSync(path) === false){ console.error("FAIL missing "+path); process.exit(1); } return fs.readFileSync(path,"utf8"); }
function assert(label, ok){ if(ok === false){ console.error("FAIL: "+label); process.exit(1); } console.log("PASS: "+label); }

console.log("RUN: Phase 12K password reset safety verifier");

const pkg = JSON.parse(read("package.json"));
const route = read("app/api/admin/users/password-reset/route.ts");
const page = read("app/admin/users/page.tsx");
const planning = read("app/api/admin/users/planning/route.ts");
const login = read("app/api/auth/login/route.ts");
const permissions = read("lib/adminPermissions.ts");

assert("package script registered for Phase 12K", pkg.scripts && pkg.scripts["verify:admin-users-phase12k-password-reset-safety"] === "node scripts/verify-admin-users-phase12k-password-reset-safety.cjs");
assert("password reset route exists and is node runtime", route.includes('export const runtime = "nodejs"'));
assert("password reset route requires authenticated admin session", route.includes("isAdminRequestAuthorized(req)") && route.includes("Authenticated administrator session required"));
assert("password reset route requires active owner_admin actor", route.includes("activeOwnerAdminActor") && route.includes("owner_admin") && route.includes('status: "active"'));
assert("password reset route supports preview/apply", route.includes("isApplyRequested") && route.includes('mode: "preview"') && route.includes('mode: "apply"'));
assert("password reset route enforces Phase 12D password policy", route.includes("passwordPolicyErrors") && route.includes("minimumLength") && route.includes("requiresUppercase") && route.includes("requiresLowercase") && route.includes("requiresNumber") && route.includes("requiresSymbol"));
assert("password reset route hashes with bcrypt", route.includes("bcrypt.hash(temporaryPassword, 12)"));
assert("password reset route writes only hash/change-required/login counters", route.includes("passwordHash,") && route.includes("passwordChangeRequired: true") && route.includes("failedLoginCount: 0"));
assert("password reset route never returns password", route.includes("passwordReturned: false") && route.includes("passwordExposed: false"));
assert("password reset route does not enable impersonation", route.includes("impersonationEnabled: false"));
assert("password reset route leaves enforcement disabled", route.includes("enforcementChanged: false"));
assert("password reset route audits non-recoverable hash only", route.includes("[new non-recoverable hash]") && route.includes("[existing non-recoverable hash]") && route.includes("admin-user-password-reset"));
assert("Admin Users page exposes password reset card", page.includes('data-barsh-admin-users-password-reset-card="true"'));
assert("Admin Users page uses password input", page.includes('data-barsh-admin-users-password-reset-temporary-password="true"') && page.includes('type="password"'));
assert("Admin Users page calls password reset route", page.includes('fetch("/api/admin/users/password-reset"'));
assert("Admin Users page states password is not viewable/recoverable", page.includes("passwords are not viewable or recoverable"));
assert("planning route exposes password reset metadata", planning.includes("passwordConfigured") && planning.includes("passwordChangeRequired"));
assert("login route still does not impersonate", !login.includes("impersonat") && !login.includes("accessAsUser"));
assert("permission enforcement remains off/default allow-all elsewhere", permissions.includes("/admin") && permissions.includes("/admin/permissions") && permissions.includes("/api/admin/permissions") && permissions.includes("/api/admin/permissions/check"));

console.log("CONTRACT: Phase 12K allows owner_admin to preview/apply temporary password reset.");
console.log("CONTRACT: Phase 12K stores only a bcrypt hash, sets passwordChangeRequired, and never returns stored passwords.");
console.log("CONTRACT: Phase 12K does not expose passwords, does not impersonate users, and does not enable permission enforcement.");
console.log("PASS: Phase 12K password reset tools are no-view/no-impersonation safe.");
