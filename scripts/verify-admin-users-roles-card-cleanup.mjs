import fs from "node:fs";

const pagePath = "app/admin/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

if (!page.includes("Users & Roles")) failures.push("Admin landing missing Users & Roles card label");
if (!page.includes("Manage administrator users, roles, signer profiles, and effective permissions.")) failures.push("Admin landing missing approved Users & Roles description");
if (!page.includes("href: \"/admin/users\"")) failures.push("Users & Roles card no longer links to /admin/users");
if (page.includes("Users / Roles")) failures.push("Old Users / Roles label remains on admin landing");
if (page.includes("Read-only Phase 2 planning surface for administrator users, roles, and effective permission review before write controls are added")) failures.push("Old Users / Roles description remains on admin landing");
if (page.includes("Read-only view of admin permission keys and route/function mappings before enforcement is enabled")) failures.push("Redundant standalone Permissions card description remains on admin landing");

const standalonePermissionsCard = /label:\s*"Permissions"[\s\S]*?href:\s*"\/admin\/permissions"/.test(page);
if (standalonePermissionsCard) failures.push("Standalone Permissions card still links from admin landing");

if (failures.length) {
  console.error("FAIL: Admin Users & Roles card cleanup verifier failed");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("PASS: Admin landing uses Users & Roles with approved signer-profile description and removes redundant standalone Permissions card.");
