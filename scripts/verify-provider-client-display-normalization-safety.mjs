#!/usr/bin/env node

import fs from "node:fs";

const scriptPath = "scripts/normalize-provider-client-display-names.mjs";
const script = fs.readFileSync(scriptPath, "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

const failures = [];

function mustContain(label, haystack, needle) {
  if (!haystack.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

mustContain("script uses provider_client", script, 'const TYPE = "provider_client";');
mustContain("script preserves original as alias", script, "providerClientOriginalDisplayName");
mustContain("script writes ReferenceEntity only", script, "prisma.referenceEntity.update");
mustContain("script writes aliases", script, "prisma.referenceAlias.upsert");
mustContain("script blocks duplicate proposals", script, "DUPLICATE_PROPOSALS");
mustContain("script hardcodes BL override", script, '["BL PAIN MANAGEMENT, PLLC", "BL Pain Management, PLLC"]');
mustContain("script hardcodes LR override", script, '["LR MEDICAL, PLLC", "LR Medical, PLLC"]');
mustContain("script uses PrismaPg adapter", script, 'import { PrismaPg } from "@prisma/adapter-pg";');
mustContain("script states no Clio writes", script, "WRITES_CLIO=false");

if (pkg.scripts?.["normalize:provider-client-display-names"] !== "node scripts/normalize-provider-client-display-names.mjs") {
  failures.push("package.json missing normalize:provider-client-display-names script");
}

if (pkg.scripts?.["verify:provider-client-display-normalization-safety"] !== "node scripts/verify-provider-client-display-normalization-safety.mjs") {
  failures.push("package.json missing verify:provider-client-display-normalization-safety script");
}

console.log("RESULT: verify provider/client display normalization safety");
console.log("EXPECTS_PROVIDER_CLIENT_ONLY=YES");
console.log("EXPECTS_ORIGINAL_ALIAS_PRESERVED=YES");
console.log("EXPECTS_DUPLICATE_BLOCK=YES");
console.log("EXPECTS_MANUAL_OVERRIDES=YES");
console.log("EXPECTS_NO_CLIO_WRITE=YES");
console.log("FAILURES=" + failures.length);

for (const failure of failures) console.log("FAIL=" + failure);

if (failures.length) process.exit(1);
