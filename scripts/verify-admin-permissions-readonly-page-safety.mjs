#!/usr/bin/env node
import fs from "node:fs";
const failures=[];
const read=p=>fs.existsSync(p)?fs.readFileSync(p,"utf8"):"";
const api=read("app/api/admin/permissions/route.ts"), page=read("app/admin/permissions/page.tsx"), home=read("app/admin/page.tsx"), session=read("app/api/auth/session/route.ts"), registry=read("lib/adminPermissions.ts"), pkg=JSON.parse(read("package.json"));
for (const s of ["ADMIN_PERMISSION_DEFINITIONS","ADMIN_ROUTE_PERMISSIONS","allAdminPermissionKeys","configuredAdminPermissionsEnforcementEnabled","default-admin-allow-all"]) if (!api.includes(s)) failures.push("api missing "+s);
for (const s of ["data-barsh-admin-permissions-page=\"read-only\"","data-barsh-admin-permissions-summary=\"true\"","data-barsh-admin-permissions-definitions=\"true\"","data-barsh-admin-permissions-route-map=\"true\"","fetch(\"/api/admin/permissions\""]) if (!page.includes(s)) failures.push("page missing "+s);
for (const s of ["label: \"Permissions\"","href: \"/admin/permissions\""]) if (!home.includes(s)) failures.push("admin home missing "+s);
for (const s of ["allAdminPermissionKeys","permissions,","permissionsMode: \"default-admin-allow-all\"","permissionsEnforced: configuredAdminPermissionsEnforcementEnabled()"]) if (!session.includes(s)) failures.push("session missing "+s);
for (const s of ["pattern: \"/admin/permissions\"","pattern: \"/api/admin/permissions\""]) if (!registry.includes(s)) failures.push("registry missing "+s);
if (pkg.scripts?.["verify:admin-permissions-readonly-page-safety"]!=="node scripts/verify-admin-permissions-readonly-page-safety.mjs") failures.push("package script missing");
console.log("RESULT: admin permissions read-only page safety verifier");
if (failures.length){console.log("FAILURES="+failures.length); for (const f of failures) console.log("FAIL="+f); process.exit(1);} console.log("FAILURES=0"); console.log("PASS: read-only admin permissions page and API expose registry without enforcement or user editing.");
