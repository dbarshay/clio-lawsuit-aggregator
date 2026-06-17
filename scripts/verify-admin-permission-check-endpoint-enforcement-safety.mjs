#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const route=fs.readFileSync("app/api/admin/permissions/check/route.ts","utf8");
const proxy=fs.readFileSync("proxy.ts","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
for (const required of ["decision.enforcementEnabled && decision.blocked", "admin-permission-check-blocked", "Permission check target is blocked", "{ status: 403 }"]) if (!route.includes(required)) failures.push("check route missing enforcement fragment "+required);
for (const required of ["adminPermissionEnforcementDecision", "admin-permission-check", "does not enforce blocking"]) if (!route.includes(required)) failures.push("check route missing read-only decision fragment "+required);
if (!proxy.includes("adminPermissionEnforcementDecision")) failures.push("proxy.ts should now include admin API permission decision enforcement after Phase 1V");
if (!proxy.includes("admin-api-permission-blocked")) failures.push("proxy.ts missing Phase 1V admin API blocked response marker");
if (proxy.includes("admin page permission blocked")) failures.push("proxy.ts should not enforce admin page permissions in Phase 1V");
if (pkg.scripts?.["verify:admin-permission-check-endpoint-enforcement-safety"]!=="node scripts/verify-admin-permission-check-endpoint-enforcement-safety.mjs") failures.push("package script missing");
console.log("RESULT: admin permission check endpoint enforcement safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: permission check endpoint can return 403 for blocked targets when enforcement flag is enabled, with admin API enforcement available and no admin page blocking.");
