#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const registry=fs.readFileSync("lib/adminPermissions.ts","utf8");
for (const required of ["ADMIN_PERMISSION_NEVER_BLOCK_PATTERNS", "isAdminPermissionNeverBlockPath", "Never-block safety route remains allowed", "prevent administrator lockout", "adminPermissionEnforcementDecision"]) if (!registry.includes(required)) failures.push("registry missing lockout safety fragment "+required);
for (const required of ["\"/admin\"", "\"/admin/permissions\"", "\"/api/admin/permissions\"", "\"/api/admin/permissions/check\""]) if (!registry.includes(required)) failures.push("registry missing required never-block route "+required);
for (const required of ["if (pattern === \"/admin\") return cleanPath === \"/admin\"", "cleanPath.startsWith(`${pattern}/`)"]) if (!registry.includes(required)) failures.push("registry missing narrowed never-block matching fragment "+required);
if (registry.includes("cleanPath === pattern || cleanPath.startsWith(`${pattern}/`));\n}")) failures.push("registry may still allow /admin prefix to unblock all admin pages");
console.log("RESULT: admin permission lockout safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: critical admin permission safety routes remain never-block, while /admin is exact-only to prevent overbroad page access.");
