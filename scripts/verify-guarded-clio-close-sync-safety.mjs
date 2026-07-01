#!/usr/bin/env node
import fs from "node:fs";

// Clio is a document repository ONLY. Closing a matter or lawsuit in Barsh Matters is LOCAL ONLY —
// it never writes matter/lawsuit status to Clio. (Supersedes the earlier "guarded Clio close-sync"
// contract, which was legacy from when Clio was going to be more than a document store.)

function read(path) {
  return fs.readFileSync(path, "utf8");
}

let failures = 0;
function pass(message) {
  console.log(`PASS: ${message}`);
}
function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}
function mustContain(label, text, needle) {
  text.includes(needle) ? pass(`${label}: found ${needle}`) : fail(`${label}: missing ${needle}`);
}
function mustNotContain(label, text, needle) {
  !text.includes(needle) ? pass(`${label}: avoids ${needle}`) : fail(`${label}: forbidden ${needle}`);
}

console.log("=== VERIFY CLOSE IS LOCAL-ONLY (NO CLIO WRITE) ===");

const matterClose = read("app/api/matters/close/route.ts");
const lawsuitClose = read("app/api/lawsuits/close/route.ts");
const settlementClose = read("app/api/settlements/close/route.ts");

// Matter close: local only, no Clio write.
mustNotContain("matter close route", matterClose, "syncClioMatterClosed");
mustNotContain("matter close route", matterClose, "clioCloseSync");
mustNotContain("matter close route", matterClose, "Local matter close was not committed.");
mustContain("matter close route", matterClose, "clioWrite: false");
mustContain("matter close route commits local ClaimIndex", matterClose, 'final_status: "Closed"');
mustContain("matter close route writes audit", matterClose, "auditLog.create");

// Lawsuit close: local only, no Clio write.
mustNotContain("lawsuit close route", lawsuitClose, "syncClioMattersClosed");
mustNotContain("lawsuit close route", lawsuitClose, "clioCloseSync");
mustNotContain("lawsuit close route", lawsuitClose, "Local lawsuit close was not committed.");
mustContain("lawsuit close route", lawsuitClose, "clioWrite: false");
mustContain("lawsuit close route commits local status", lawsuitClose, 'final_status: "Closed"');
mustContain("lawsuit close route", lawsuitClose, "CHILD_CLOSED_REASON");

// Neither close route may hydrate ClaimIndex from Clio.
for (const [label, src] of [["matter close route", matterClose], ["lawsuit close route", lawsuitClose]]) {
  mustNotContain(label, src, "upsertClaimIndexFromMatter");
  mustNotContain(label, src, "ingestMattersFromClioBatch");
}

// Settlement close shortcut must not perform a matter/lawsuit close-status Clio write either.
mustNotContain("settlement close shortcut", settlementClose, "syncClioMatterClosed");
mustNotContain("settlement close shortcut", settlementClose, "syncClioMattersClosed");

if (failures) {
  console.error(`=== CLOSE IS LOCAL-ONLY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== CLOSE IS LOCAL-ONLY PASSED ===");
console.log("Rule: closing a matter or lawsuit is local-only; Clio is a document repository and is never written for status.");
