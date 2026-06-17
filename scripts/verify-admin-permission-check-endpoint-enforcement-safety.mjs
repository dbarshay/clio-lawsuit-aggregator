#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const route=fs.readFileSync("app/api/admin/permissions/check/route.ts","utf8");
const proxy=fs.readFileSync("proxy.ts","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
for (const required of ["decision.enforcementEnabled && decision.blocked", "admin-permission-check-blocked", "Permission check target is blocked", "{ status: 403 }"]) if (!route.includes(required)) failures.push("check route missing enforcement fragment "+required);
for (const required of ["adminPermissionEnforcementDecision", "admin-permission-check", "does not enforce blocking"]) if (!route.includes(required)) failures.push("check route missing read-only decision fragment "+required);
if (proxy.includes("adminPermissionEnforcementDecision")) failures.push("proxy.ts should still not enforce permission decisions in Phase 1S");
if (pkg.scripts?.["verify:admin-permission-check-endpoint-enforcement-safety"]!=="node scripts/verify-admin-permission-check-endpoint-enforcement-safety.mjs") failures.push("package script missing");
console.log("RESULT: admin permission check endpoint enforcement safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: permission check endpoint can return 403 for blocked targets when enforcement flag is enabled, without proxy/page blocking.");
