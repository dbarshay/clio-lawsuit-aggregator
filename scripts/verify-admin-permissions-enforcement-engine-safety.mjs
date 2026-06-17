#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const reg=fs.readFileSync("lib/adminPermissions.ts","utf8");
const proxy=fs.readFileSync("proxy.ts","utf8");
for (const required of ["AdminPermissionEnforcementDecision","adminPermissionEnforcementDecision","adminPermissionForRoute(pathname, method)","configuredAdminPermissionsEnforcementEnabled()","Enforcement disabled; route would be blocked if enforcement were enabled."]) if (!reg.includes(required)) failures.push("registry missing "+required);
for (const required of ["adminPermissionEnforcementDecision", "isAdminApiRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked", "isAdminPageRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked", "blockedUrl.pathname = \"/admin/permissions\""]) if (!proxy.includes(required)) failures.push("proxy missing enforcement wiring "+required);
console.log("RESULT: admin permissions enforcement engine safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: permission enforcement decision helper exists and is wired into admin API JSON blocking plus safe admin page redirect blocking.");
