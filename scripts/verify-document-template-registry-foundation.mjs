#!/usr/bin/env node
import fs from "fs";

const registryPath = "lib/documents/templateRegistry.ts";
const routePath = "app/api/settlements/documents-preview/route.ts";

const registry = fs.readFileSync(registryPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");

const checks = [
  ["registry file exists", fs.existsSync(registryPath)],
  ["settlement registry export", registry.includes("SETTLEMENT_DOCUMENT_TEMPLATES")],
  ["build helper export", registry.includes("buildSettlementPlannedDocuments")],
  ["settlement summary seeded", registry.includes('"settlement-summary"')],
  ["provider remittance seeded", registry.includes('"provider-remittance-breakdown"')],
  ["attorney fee seeded", registry.includes('"attorney-fee-breakdown"')],
  ["future repository marker", registry.includes("database-backed editable template repository")],
  ["route imports registry", route.includes('buildSettlementPlannedDocuments')],
  ["route uses registry helper", route.includes("const plannedDocuments = buildSettlementPlannedDocuments")],
  ["route no longer hardcodes planned array", !route.includes("const plannedDocuments = [")],
  ["local-first retained", route.includes('sourceOfTruth: "barsh-matters-local"') || registry.includes('sourceOfTruth: "barsh-matters-local"')],
];

let failed = false;
for (const [label, ok] of checks) {
  if (ok) {
    console.log(`PASS: ${label}`);
  } else {
    console.log(`FAIL: ${label}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("PASS: document template registry foundation verifier");
