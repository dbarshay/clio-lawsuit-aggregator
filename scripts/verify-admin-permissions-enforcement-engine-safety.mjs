#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const reg=fs.readFileSync("lib/adminPermissions.ts","utf8");
const proxy=fs.readFileSync("proxy.ts","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
for (const required of ["AdminPermissionEnforcementDecision","adminPermissionEnforcementDecision","adminPermissionForRoute(pathname, method)","configuredAdminPermissionsEnforcementEnabled()","Enforcement disabled; route would be blocked if enforcement were enabled."]) if (!reg.includes(required)) failures.push("registry missing "+required);
if (!proxy.includes("adminPermissionEnforcementDecision")) failures.push("proxy.ts should include admin API permission enforcement after Phase 1V");
if (!proxy.includes("admin-api-permission-blocked")) failures.push("proxy.ts missing Phase 1V admin API blocked marker");
if (proxy.includes("admin page permission blocked")) failures.push("proxy.ts should not enforce admin page permissions in Phase 1V");
if (pkg.scripts?.["verify:admin-permissions-enforcement-engine-safety"]!=="node scripts/verify-admin-permissions-enforcement-engine-safety.mjs") failures.push("package script missing");
console.log("RESULT: admin permissions enforcement engine safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: permission enforcement decision helper exists and is wired only into admin API blocking, not admin page blocking.");
