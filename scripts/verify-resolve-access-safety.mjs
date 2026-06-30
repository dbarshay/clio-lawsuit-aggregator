import fs from "node:fs";

// Locks the safety contract of the role access resolver (lib/admin-permissions/resolveAccess.ts).

const src = fs.readFileSync("lib/admin-permissions/resolveAccess.ts", "utf8");
const failures = [];
const must = (cond, msg) => { if (!cond) failures.push(msg); };

must(src.includes("if (input.isOwner) return"), "owner bypasses everything first");
must(src.includes("Owner has full access"), "owner reason present");
must(src.includes("isNeverBlockPath(input.pathname)"), "never-block lockout-safety check");
must(src.includes("/admin/permissions"), "permissions area is a never-block path");
must(src.includes("No permission mapping; default allow"), "unmapped routes default-allow");
must(src.includes('requiredTier === "security"') && src.includes("Owner-only"), "security tier is owner-only");
must(src.includes('requiredTier === "admin"') && src.includes("grantedAdminPermissionKeys"), "admin tier requires a per-user grant");
must(src.includes('roleKeys.includes("administrator")'), "admin grant limited to administrator role");
must(src.includes("TIER_RANK[item.tier] > TIER_RANK[max]"), "most-restrictive tier governs a multi-match route");
must(src.includes("roleAllowsTier"), "view/edit/process checked against role tiers");
must(src.includes("function roleEnforcementEnabled") && src.includes("BARSH_ROLE_ENFORCEMENT_ENABLED"), "single env kill-switch (default off)");
must(!src.includes('"server-only"'), "resolver stays edge/middleware-safe (no server-only lock)");
must(!/PrismaClient|from ["']@\/lib\/(db|prisma)/.test(src), "resolver stays pure (no DB import)");

if (failures.length) {
  console.error("FAIL: resolveAccess safety");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}
console.log("PASS: resolveAccess safety contract (owner-bypass, never-block, default-allow, security owner-only, admin per-grant, kill-switch).");
