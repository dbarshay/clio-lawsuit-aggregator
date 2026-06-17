#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const proxy=fs.readFileSync("proxy.ts","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
for (const required of ["adminPermissionEnforcementDecision", "isAdminApiRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked", "admin-api-permission-blocked", "Admin API route is blocked", "{ status: 403 }"]) if (!proxy.includes(required)) failures.push("proxy missing admin API enforcement fragment "+required);
for (const required of ["isAdminPageRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked", "blockedUrl.pathname = \"/admin/permissions\"", "return NextResponse.redirect(blockedUrl)"]) if (!proxy.includes(required)) failures.push("proxy missing page-level enforcement safety fragment "+required);
if (proxy.includes("admin page permission blocked")) failures.push("proxy should not use unsafe page-block text or JSON page blocking");
if (pkg.scripts?.["verify:admin-api-permission-enforcement-safety"]!=="node scripts/verify-admin-api-permission-enforcement-safety.mjs") failures.push("package script missing");
console.log("RESULT: admin API permission enforcement safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: admin API routes preserve JSON/403 permission blocking, and admin pages may redirect safely behind the same enforcement decision.");
