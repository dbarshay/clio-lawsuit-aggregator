import fs from "node:fs";

const directPath = "app/matter/[id]/page.tsx";
const masterPath = "app/matters/page.tsx";
const direct = fs.readFileSync(directPath, "utf8");
const master = fs.readFileSync(masterPath, "utf8");

let failures = 0;

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function mustContain(source, sourceName, label, needle) {
  if (source.includes(needle)) pass(`${sourceName}: found ${label}`);
  else fail(`${sourceName}: missing ${label}`);
}

function mustNotContain(source, sourceName, label, needle) {
  if (!source.includes(needle)) pass(`${sourceName}: does not contain ${label}`);
  else fail(`${sourceName}: contains forbidden ${label}`);
}

console.log("=== DOCUMENT GENERATION ACTION LAUNCH SAFETY VERIFICATION ===");

mustContain(direct, directPath, "direct launcher", "launchMatterDocumentGenerationDialog");
mustContain(direct, directPath, "direct action title", "Launch the Direct Matter document generation preview.");
mustContain(direct, directPath, "direct scroll target", 'id="matter-document-data-preview-panel"');
mustContain(direct, directPath, "direct preview loader", "loadMatterDocumentDataPreview");
mustContain(direct, directPath, "direct workspace switch", 'setActiveWorkspaceTab("documents")');
mustContain(direct, directPath, "Document Generation label", "Document Generation");

mustContain(master, masterPath, "master launcher", "launchMasterDocumentGenerationDialog");
mustContain(master, masterPath, "master action title", "Launch the Master Lawsuit document generation preview.");
mustContain(master, masterPath, "master scroll target", 'id="master-document-data-preview-panel"');
mustContain(master, masterPath, "master preview loader", "loadMasterDocumentDataPreview");
mustContain(master, masterPath, "master workspace switch", 'setActiveMasterWorkspaceTab("documents")');
mustContain(master, masterPath, "Document Generation label", "Document Generation");

mustNotContain(direct, directPath, "old direct placeholder title", "View Documents action will be wired later.");
mustNotContain(master, masterPath, "old master placeholder title", "Document controls remain in the Documents workflow.");
mustNotContain(direct, directPath, "matter-context dependency", "matter-context");
mustNotContain(master, masterPath, "matter-context dependency", "matter-context");

if (failures > 0) {
  console.error(`=== DOCUMENT GENERATION ACTION LAUNCH SAFETY VERIFICATION FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== DOCUMENT GENERATION ACTION LAUNCH SAFETY VERIFICATION PASSED ===");
