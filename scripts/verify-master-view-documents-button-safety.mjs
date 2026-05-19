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
  if (!page.includes(needle)) pass(`${pagePath}: does not contain ${label}`);
  else fail(`${pagePath}: contains forbidden ${label}`);
}

console.log("=== MASTER VIEW DOCUMENTS BUTTON SAFETY VERIFICATION ===");

mustContain("View Documents button label", "View Documents");
mustContain("documents workspace onClick", 'setActiveMasterWorkspaceTab("documents")');
mustContain("documents workspace preview renderer", "renderMasterDocumentDataPreviewPanel");
mustContain("Preview Lawsuit Data button", "Preview Lawsuit Data");
mustContain("Master packet endpoint", "/api/documents/packet?masterLawsuitId=");
mustContain("updated documents title", "Open the Master Lawsuit Documents workspace.");

mustNotContain("preview route using matter-context", "matter-context");
mustNotContain("preview action writing to Clio", "loadMasterDocumentDataPreviewToClio");

if (failures > 0) {
  console.error(`=== MASTER VIEW DOCUMENTS BUTTON SAFETY VERIFICATION FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== MASTER VIEW DOCUMENTS BUTTON SAFETY VERIFICATION PASSED ===");
