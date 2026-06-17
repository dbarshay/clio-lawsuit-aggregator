#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const page=fs.readFileSync("app/admin/permissions/page.tsx","utf8");
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
for (const required of ["data-barsh-admin-permissions-blocked-notice=\"true\"", "blockedNotice", "params.get(\"blocked\") === \"1\"", "params.get(\"from\")", "params.get(\"permission\")", "Access blocked:", "This safety page remains available"]) if (!page.includes(required)) failures.push("permissions page missing blocked notice fragment "+required);
for (const forbidden of ["fetch(\"/api/admin/permissions/check", "POST", "PUT", "PATCH", "DELETE"]) if (page.includes(forbidden)) failures.push("blocked notice page should remain read-only and not add write/check action fragment "+forbidden);
if (pkg.scripts?.["verify:admin-permissions-blocked-notice-safety"]!=="node scripts/verify-admin-permissions-blocked-notice-safety.mjs") failures.push("package script missing");
console.log("RESULT: admin permissions blocked notice safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);}
console.log("FAILURES=0");
console.log("PASS: permissions page shows a read-only blocked-route notice when redirected by page-level permission enforcement.");
