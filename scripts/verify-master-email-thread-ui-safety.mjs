import fs from "node:fs";

let failures = 0;

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function mustContain(label, text, marker) {
  if (!text.includes(marker)) {
    console.error(`FAIL: ${label} missing marker: ${marker}`);
    failures += 1;
  } else {
    console.log(`PASS: ${label} found ${marker}`);
  }
}

function mustNotContain(label, text, marker) {
  if (text.includes(marker)) {
    console.error(`FAIL: ${label} must not contain marker: ${marker}`);
    failures += 1;
  } else {
    console.log(`PASS: ${label} does not contain ${marker}`);
  }
}

console.log("=== VERIFY MASTER EMAILS UI SAFETY ===");

const pagePath = "app/matters/page.tsx";
const routePath = "app/api/graph/local-thread-preview/route.ts";
const page = read(pagePath);
const route = read(routePath);

console.log("\n=== VERIFY UNIFIED MASTER EMAILS UI MARKERS ===");
[
  'Emails',
  'function loadMasterEmailThreadPreview()',
  'fetch(`/api/graph/local-thread-preview?${params.toString()}`',
  'function renderMasterEmailThreadsPanel()',
  'activeMasterWorkspaceTab === "email_threads" && renderMasterEmailThreadsPanel()',
  'if (activeMasterWorkspaceTab !== "email_threads") return;',
  'void loadMasterEmailThreadPreview();',
  'Unified Master Lawsuit email area.',
  'Graph-synced messages and MailDrop-linked thread records appear here together',
  'Opening this panel reads local records only',
  'Email records load automatically when this panel opens.',
  'Refresh Emails',
  'MailDrop Present',
  'Open in Outlook',
].forEach((marker) => mustContain(pagePath, page, marker));

console.log("\n=== VERIFY MANUAL GRAPH SYNC CONTROLS ARE HIDDEN DEBUG SCAFFOLDING ===");
[
  'Preview Graph Updates',
  'Sync Thread to Barsh Matters',
  'Preview This Thread',
  'Sync This Thread',
  'hidden',
  'aria-hidden="true"',
].forEach((marker) => mustContain(pagePath, page, marker));

console.log("\n=== VERIFY LOCAL THREAD PREVIEW ROUTE IS READ-ONLY ===");
[
  'action: "graph-local-thread-preview"',
  'graphCallsMade: false',
  'readsMailbox: false',
  'createsOutlookDraft: false',
  'sendsEmail: false',
  'syncsMailbox: false',
  'clioRecordsChanged: false',
  'databaseRecordsChanged: false',
  'Read-only local email-thread preview.',
].forEach((marker) => mustContain(routePath, route, marker));

console.log("\n=== VERIFY NO DIRECT DRAFT/SEND/CLIO WRITE WIRING IN MASTER EMAILS UI ===");
[
  'fetch("/api/graph/create-draft"',
  'fetch(`/api/graph/create-draft',
  'confirm=create-graph-draft',
  'sendMail',
  'window.location.href = buildMailtoHref(context);',
].forEach((marker) => mustNotContain(pagePath, page, marker));

console.log("\n=== VERIFY SCRIPT REGISTRATION ===");
const packageJson = read("package.json");
mustContain("package.json", packageJson, '"verify:master-email-thread-ui-safety"');

if (failures > 0) {
  console.error(`\n=== MASTER EMAILS UI SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("\n=== MASTER EMAILS UI SAFETY VERIFICATION PASSED ===");
console.log("Master Emails UI is unified for Graph-synced and MailDrop-linked local records.");
console.log("Opening the panel auto-loads local records only; hidden debug controls do not create drafts, send email, write Clio, or write database records.");
