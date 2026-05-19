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
  if (!page.includes(needle)) pass(`${pagePath}: does not contain ${label}`);
  else fail(`${pagePath}: contains forbidden ${label}`);
}

console.log("=== DIRECT VIEW DOCUMENTS BUTTON SAFETY VERIFICATION ===");

mustContain("View Documents button label", "View Documents");
mustContain("documents workspace onClick", 'setActiveWorkspaceTab("documents")');
mustContain("documents workspace preview renderer", "renderMatterDocumentDataPreviewPanel");
mustContain("Preview Matter Data button", "Preview Matter Data");
mustContain("Direct matter packet endpoint", "/api/documents/matter-packet");
mustContain("updated documents title", "Open the Direct Matter Documents workspace.");

mustNotContain("old placeholder title", "View Documents action will be wired later.");
mustNotContain("matter-context dependency", "matter-context");

if (failures > 0) {
  console.error(`=== DIRECT VIEW DOCUMENTS BUTTON SAFETY VERIFICATION FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== DIRECT VIEW DOCUMENTS BUTTON SAFETY VERIFICATION PASSED ===");
