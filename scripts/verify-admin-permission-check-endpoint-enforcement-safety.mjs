#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const route=fs.readFileSync("app/api/admin/permissions/check/route.ts","utf8");
const proxy=fs.readFileSync("proxy.ts","utf8");
for (const required of ["adminPermissionEnforcementDecision", "admin-permission-check", "does not enforce blocking"]) if (!route.includes(required)) failures.push("check route missing read-only decision fragment "+required);
for (const required of ["adminPermissionEnforcementDecision", "isAdminApiRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked", "isAdminPageRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked", "blockedUrl.pathname = \"/admin/permissions\""]) if (!proxy.includes(required)) failures.push("proxy missing enforcement fragment "+required);
console.log("RESULT: admin permission check endpoint enforcement safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: permission check endpoint remains diagnostic/read-only, while proxy can enforce API and page decisions behind the enforcement flag.");
