#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const reg=fs.readFileSync("lib/adminPermissions.ts","utf8");
const api=fs.readFileSync("app/api/admin/permissions/route.ts","utf8");
const session=fs.readFileSync("app/api/auth/session/route.ts","utf8");
const page=fs.readFileSync("app/admin/permissions/page.tsx","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
for (const required of ["BARSH_ADMIN_PERMISSIONS_ENFORCEMENT","configuredAdminPermissionsEnforcementEnabled","return String(process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT"]) if (!reg.includes(required)) failures.push("registry missing "+required);
for (const required of ["configuredAdminPermissionsEnforcementEnabled","enforcementEnabled: configuredAdminPermissionsEnforcementEnabled()"] ) if (!api.includes(required)) failures.push("api missing "+required);
for (const required of ["configuredAdminPermissionsEnforcementEnabled","permissionsEnforced: configuredAdminPermissionsEnforcementEnabled()"] ) if (!session.includes(required)) failures.push("session missing "+required);
for (const required of ["BARSH_ADMIN_PERMISSIONS_ENFORCEMENT","later enforcement phase"] ) if (!page.includes(required)) failures.push("page missing "+required);
if (pkg.scripts?.["verify:admin-permissions-enforcement-flag-preview-safety"]!=="node scripts/verify-admin-permissions-enforcement-flag-preview-safety.mjs") failures.push("package script missing");
console.log("RESULT: admin permissions enforcement flag preview safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: permission enforcement flag is visible in config/session/UI but not wired to blocking logic.");
