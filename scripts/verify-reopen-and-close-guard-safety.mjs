#!/usr/bin/env node
import fs from "node:fs";

// Reopen + close-guard contract:
//  - Closing a matter is blocked when it is aggregated into an OPEN lawsuit.
//  - Reopening a matter (admin) is local-only and blocked when the matter belongs to a lawsuit
//    (reopen via the lawsuit instead).
//  - Reopening a lawsuit (admin) is local-only and cascades child matters back to Open.
//  - None of these reopen paths writes to Clio (Clio is a document repository only).

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

console.log("=== VERIFY REOPEN + CLOSE-GUARD SAFETY ===");

const membership = read("lib/lawsuitMembership.ts");
const matterClose = read("app/api/matters/close/route.ts");
const matterReopen = read("app/api/matters/reopen/route.ts");
const lawsuitReopen = read("app/api/lawsuits/reopen/route.ts");
const matterPage = read("app/matter/[id]/page.tsx");
const mattersPage = read("app/matters/page.tsx");
const pkg = read("package.json");

// Shared membership helper.
mustContain("membership helper", membership, "export async function getLawsuitMembershipForMatter");
mustContain("membership helper", membership, "export function lawsuitOptionsAreClosed");

// Matter close guard: blocks close when in an open lawsuit.
mustContain("matter close guard", matterClose, "getLawsuitMembershipForMatter");
mustContain("matter close guard", matterClose, "membership.inLawsuit && membership.lawsuitOpen");
mustContain("matter close guard message", matterClose, "Close the lawsuit to close its matters.");

// Matter reopen route: local-only, admin, blocks in-lawsuit matters.
mustContain("matter reopen route", matterReopen, 'action: "local-reopen-matter"');
mustContain("matter reopen route", matterReopen, "clioWrite: false");
mustContain("matter reopen route", matterReopen, 'final_status: "Open"');
mustContain("matter reopen route blocks in-lawsuit", matterReopen, "Reopen the lawsuit to reopen its matters.");
mustNotContain("matter reopen route", matterReopen, "clioFetch");
mustNotContain("matter reopen route", matterReopen, "syncClioMatter");

// Lawsuit reopen route: local-only, cascades child matters to Open.
mustContain("lawsuit reopen route", lawsuitReopen, 'action: "local-reopen-lawsuit"');
mustContain("lawsuit reopen route", lawsuitReopen, "clioWrite: false");
mustContain("lawsuit reopen route cascades children", lawsuitReopen, "claimIndex.updateMany");
mustContain("lawsuit reopen route sets child open", lawsuitReopen, 'final_status: "Open"');
mustNotContain("lawsuit reopen route", lawsuitReopen, "clioFetch");
mustNotContain("lawsuit reopen route", lawsuitReopen, "syncClioMatters");

// UI: admin reopen buttons wired to the local routes.
mustContain("matter page reopen button", matterPage, "Reopen Matter (Admin)");
mustContain("matter page reopen calls route", matterPage, "/api/matters/reopen");
mustContain("matter page reopen is admin-gated", matterPage, 'runAdministratorGate("Reopen Matter"');
mustContain("matters page reopen button", mattersPage, "Reopen Lawsuit (Admin)");
mustContain("matters page reopen calls route", mattersPage, "/api/lawsuits/reopen");
mustContain("matters page reopen is admin-gated", mattersPage, 'runAdministratorGate("Reopen Lawsuit"');

// Registered in package.json.
mustContain("package.json", pkg, "verify:reopen-and-close-guard-safety");

if (failures) {
  console.error(`=== REOPEN + CLOSE-GUARD SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== REOPEN + CLOSE-GUARD SAFETY PASSED ===");
console.log("Rule: reopen is local-only and admin-gated; closing a matter is blocked inside an open lawsuit; lawsuit reopen cascades to child matters.");
