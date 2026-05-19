import fs from "node:fs";

const pagePath = "app/matters/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function mustContain(label, needle) {
  if (page.includes(needle)) pass(`${pagePath}: found ${label}`);
  else fail(`${pagePath}: missing ${label}`);
}

function mustNotContain(label, needle) {
  if (!page.includes(needle)) pass(`${pagePath}: contains no ${label}`);
  else fail(`${pagePath}: contains forbidden ${label}`);
}

console.log("=== MASTER DOCUMENT GENERATION ACTION BUTTON SAFETY VERIFICATION ===");

mustContain("Document Generation action label", "Document Generation");
mustContain("document generation launcher", "launchMasterDocumentGenerationDialog");
mustContain("documents workspace switch", 'setActiveMasterWorkspaceTab("documents")');
mustContain("documents workspace preview renderer", "renderMasterDocumentDataPreviewPanel");
mustContain("Preview Lawsuit Data button", "Preview Lawsuit Data");
mustContain("Master packet endpoint", "/api/documents/packet?masterLawsuitId=");
mustContain("master preview scroll target", 'id="master-document-data-preview-panel"');
mustContain("master generation preview title", "Launch the Master Lawsuit document generation preview.");

mustNotContain("old master placeholder title", "Document controls remain in the Documents workflow.");
mustNotContain("matter-context dependency", "matter-context");
mustNotContain("master Clio write action", "loadMasterDocumentDataPreviewToClio");

if (failures > 0) {
  console.error(`=== MASTER DOCUMENT GENERATION ACTION BUTTON SAFETY VERIFICATION FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== MASTER DOCUMENT GENERATION ACTION BUTTON SAFETY VERIFICATION PASSED ===");
