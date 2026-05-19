import fs from "node:fs";

const pagePath = "app/matter/[id]/page.tsx";
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

console.log("=== DIRECT DOCUMENT GENERATION ACTION BUTTON SAFETY VERIFICATION ===");

mustContain("Document Generation action label", "Document Generation");
mustContain("document generation launcher", "launchMatterDocumentGenerationDialog");
mustContain("documents workspace switch", 'setActiveWorkspaceTab("documents")');
mustContain("documents workspace preview renderer", "renderMatterDocumentDataPreviewPanel");
mustContain("Preview Matter Data button", "Preview Matter Data");
mustContain("Direct matter packet endpoint", "/api/documents/matter-packet");
mustContain("direct preview scroll target", 'id="matter-document-data-preview-panel"');
mustContain("direct generation preview title", "Launch the Direct Matter document generation preview.");

mustNotContain("old direct placeholder title", "View Documents action will be wired later.");
mustNotContain("matter-context dependency", "matter-context");
mustNotContain("direct Clio write action", "loadMatterDocumentDataPreviewToClio");

if (failures > 0) {
  console.error(`=== DIRECT DOCUMENT GENERATION ACTION BUTTON SAFETY VERIFICATION FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== DIRECT DOCUMENT GENERATION ACTION BUTTON SAFETY VERIFICATION PASSED ===");
