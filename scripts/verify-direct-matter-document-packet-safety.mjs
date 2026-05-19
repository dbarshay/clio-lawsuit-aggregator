import fs from "node:fs";

const routePath = "app/api/documents/matter-packet/route.ts";
const route = fs.readFileSync(routePath, "utf8");

let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function mustContain(label, needle) {
  if (route.includes(needle)) pass(`${routePath}: found ${label}`);
  else fail(`${routePath}: missing ${label}`);
}

function mustNotContain(label, needle) {
  if (!route.includes(needle)) pass(`${routePath}: does not contain ${label}`);
  else fail(`${routePath}: contains forbidden ${label}`);
}

console.log("=== DIRECT MATTER DOCUMENT PACKET SAFETY VERIFICATION ===");

mustContain("direct matter route", "documentScope: \"direct_matter\"");
mustContain("documentData contract", "documentData");
mustContain("readyForTemplates true", "readyForTemplates: true");
mustContain("generatesDocuments false", "generatesDocuments: false");
mustContain("localOnly true", "localOnly: true");
mustContain("clioCorrectnessDependency false", "clioCorrectnessDependency: false");
mustContain("templateFields", "templateFields");
mustContain("local ClaimIndex read", "prisma.claimIndex.findFirst");
mustContain("local ReferenceEntity read", "prisma.referenceEntity.findMany");
mustContain("optional local lawsuit context", "prisma.lawsuit.findUnique");
mustContain("reference details exposure", "hiddenDetails");
mustContain("provider/client reference lookup", "provider_client");
mustContain("patient reference lookup", "patient");
mustContain("insurer reference lookup", "insurer_company");
mustContain("treating provider reference lookup", "treating_provider");
mustContain("local-only refresh reason", "local-direct-matter-document-packet-no-clio-refresh");

mustNotContain("clioFetch", "clioFetch(");
mustNotContain("ingestMattersFromClioBatch", "ingestMattersFromClioBatch");
mustNotContain("indexMatterInternal", "indexMatterInternal");
mustNotContain("forceRefreshOnlyThisLawsuit", "forceRefreshOnlyThisLawsuit");
mustNotContain("Clio refresh warning", "refreshed from Clio");
mustNotContain("refresh.errors dependency", "refresh.errors");
mustNotContain("refresh.seedCount dependency", "refresh.seedCount");
mustNotContain("refresh.refreshedMatterIds dependency", "refresh.refreshedMatterIds");

if (failures > 0) {
  console.error(`=== DIRECT MATTER DOCUMENT PACKET SAFETY VERIFICATION FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== DIRECT MATTER DOCUMENT PACKET SAFETY VERIFICATION PASSED ===");
