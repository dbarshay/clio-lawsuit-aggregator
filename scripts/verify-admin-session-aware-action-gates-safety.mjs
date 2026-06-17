#!/usr/bin/env node
import fs from "node:fs";
const failures = [];
const files = ["app/matters/page.tsx", "app/matter/[id]/page.tsx"];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const match = text.match(/async function runAdministratorGate\(actionLabel: string, onAuthorized: \(\) => void\) \{([\s\S]*?)\n  \}/);
  if (!match) { failures.push(file + ": missing runAdministratorGate"); continue; }
  const body = match[1];
  for (const required of ["/api/auth/session", "json?.authenticated", "/login?from=", "encodeURIComponent", "onAuthorized();"]) if (!body.includes(required)) failures.push(file + ": gate missing session-aware fragment " + required);
  for (const forbidden of ["ADMINISTRATOR ACCESS REQUIRED", "/api/admin/authorize", "window.prompt", "Enter administrator password"]) if (body.includes(forbidden)) failures.push(file + ": gate still has prompt-auth fragment " + forbidden);
  if (!text.includes("void runAdministratorGate(")) failures.push(file + ": expected existing action callers to remain wired through gate");
}
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (pkg.scripts?.["verify:admin-session-aware-action-gates-safety"] !== "node scripts/verify-admin-session-aware-action-gates-safety.mjs") failures.push("package.json missing verify:admin-session-aware-action-gates-safety script");
console.log("RESULT: admin session-aware action gates safety verifier");
if (failures.length) { console.log("FAILURES=" + failures.length); for (const failure of failures) console.log("FAIL=" + failure); process.exit(1); }
console.log("FAILURES=0");
console.log("PASS: remaining audit/history action gates use session check and login redirect instead of password prompt.");
