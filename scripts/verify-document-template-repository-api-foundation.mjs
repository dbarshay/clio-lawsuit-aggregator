#!/usr/bin/env node
import fs from "fs";

const registryPath = "lib/documents/templateRegistry.ts";
const routePath = "app/api/documents/templates/route.ts";

const registry = fs.readFileSync(registryPath, "utf8");
const route = fs.readFileSync(routePath, "utf8");

const checks = [
  ["repository route exists", fs.existsSync(routePath)],
  ["merge field type exists", registry.includes("BarshDocumentMergeFieldDefinition")],
  ["settlement merge fields exist", registry.includes("SETTLEMENT_MERGE_FIELDS")],
  ["repository records helper exists", registry.includes("templateRepositoryRecords")],
  ["editable repository flag exists", registry.includes("editableInRepository")],
  ["versioning planned flag exists", registry.includes("versioningPlanned")],
  ["route imports repository records", route.includes("templateRepositoryRecords")],
  ["route supports category filter", route.includes("normalizeCategory")],
  ["route is read-only safety", route.includes("readOnly: true")],
  ["route blocks template writes", route.includes("templateRepositoryWrites: false")],
  ["route has future repository marker", route.includes("database-backed editable document-template repository")],
  ["route does not import prisma", !route.includes("@/lib/prisma")],
  ["route does not import Clio helpers", !route.includes("@/lib/clio") && !route.includes("clioClient")],
  ["route does not call Clio endpoints", !route.includes("/api/clio") && !route.includes("clio-maildrop")],
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
console.log("PASS: document template repository API foundation verifier");
