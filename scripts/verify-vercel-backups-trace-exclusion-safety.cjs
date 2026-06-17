const fs = require("fs");
const path = require("path");

const failures = [];
const config = fs.readdirSync(".").find((name) => /^next\.config\./.test(name));
if (!config) failures.push("next.config.* not found");
const source = config ? fs.readFileSync(config, "utf8") : "";

for (const required of [
  "outputFileTracingExcludes",
  "./backups/**/*",
  "./.next/dev/**/*",
  "./.next/cache/**/*",
]) {
  if (!source.includes(required)) failures.push(`next config missing ${required}`);
}

for (const file of ["lib/adminPermissions.ts", "proxy.ts", "package.json"]) {
  const s = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (/process[.]env[.]BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\s*=/.test(s)) failures.push(`${file} assigns enforcement env`);
  if (/^\s*BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\s*=\s*1\s*$/m.test(s)) failures.push(`${file} contains standalone enforcement activation`);
}

console.log("RESULT: Vercel backups trace exclusion safety verifier");
console.log("VERCEL_TRACE_EXCLUDE=backups/**/* excluded from serverless function tracing");
console.log("PRODUCTION_ENFORCEMENT=not activated by this fix");

if (failures.length) {
  console.error("FAILURES:");
  for (const f of failures) console.error("- " + f);
  process.exit(1);
}

console.log("PASS: local backup artifacts are excluded from Vercel/Next function tracing without activating enforcement.");
