import fs from "node:fs";

const proxy = fs.readFileSync("proxy.ts", "utf8");
const registry = fs.readFileSync("lib/adminPermissions.ts", "utf8");
const failures = [];

for (const required of [
  "adminPermissionEnforcementDecision(pathname, isAdminApiRequest ? req.method : \"GET\")",
  "isAdminApiRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked",
  "admin-api-permission-blocked",
  "isAdminPageRequest && permissionDecision.enforcementEnabled && permissionDecision.blocked",
  "blockedUrl.pathname = \"/admin/permissions\"",
  "blockedUrl.searchParams.set(\"blocked\", \"1\")",
  "blockedUrl.searchParams.set(\"from\", `${pathname}${req.nextUrl.search}`)",
  "blockedUrl.searchParams.set(\"permission\", permissionDecision.permission)",
  "return NextResponse.redirect(blockedUrl)",
]) {
  if (!proxy.includes(required)) failures.push(`proxy missing page-level permission enforcement fragment: ${required}`);
}

for (const forbidden of [
  "blockedUrl.pathname = \"/login\"",
  "action: \"admin-page-permission-blocked\"",
]) {
  if (proxy.includes(forbidden)) failures.push(`proxy should not use unsafe/JSON page blocking fragment: ${forbidden}`);
}

for (const required of [
  "ADMIN_PERMISSION_NEVER_BLOCK_PATTERNS",
  "isAdminPermissionNeverBlockPath",
  "prevent administrator lockout",
  "adminPermissionEnforcementDecision",
]) {
  if (!registry.includes(required)) failures.push(`registry missing never-block lockout safety fragment: ${required}`);
}

if (failures.length) {
  console.error("FAIL: admin page permission enforcement safety");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log("PASS: admin page permission enforcement safety");
