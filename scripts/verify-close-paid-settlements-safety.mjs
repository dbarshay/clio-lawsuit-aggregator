#!/usr/bin/env node
import fs from "node:fs";

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

console.log("=== VERIFY CLOSE PAID SETTLEMENTS GUARDED ROUTE BRIDGE SAFETY ===");

const settlementCloseRoute = read("app/api/settlements/close/route.ts");
const lawsuitCloseRoute = read("app/api/lawsuits/close/route.ts");
const matterPage = read("app/matter/[id]/page.tsx");
const packageJson = read("package.json");

mustContain("settlement close shortcut remains blocked", settlementCloseRoute, "legacyClioOperationalRouteBlocked");
mustContain("settlement close shortcut identifies blocked route", settlementCloseRoute, "app/api/settlements/close");
mustNotContain("settlement close shortcut must not call guarded helper", settlementCloseRoute, "syncClioMatterClosed");
mustNotContain("settlement close shortcut must not call guarded helper", settlementCloseRoute, "syncClioMattersClosed");

mustContain("local lawsuit close route exists", lawsuitCloseRoute, 'action: "local-close-lawsuit"');
mustNotContain("lawsuit close route performs no Clio close sync", lawsuitCloseRoute, "syncClioMattersClosed");
mustContain("lawsuit close route writes no Clio status", lawsuitCloseRoute, "clioWrite: false");

mustContain("matter page still exposes Close Paid Settlements convenience action", matterPage, "Close Paid Settlements");
mustContain("matter page close paid settlements uses guarded Close Lawsuit route", matterPage, "/api/lawsuits/close");
mustContain("matter page close paid settlements supplies settlement close reason", matterPage, 'closeReason: "PAID (SETTLEMENT)"');
mustContain("matter page says close is local in Barsh Matters", matterPage, "closes the lawsuit locally in Barsh Matters");
mustContain("matter page says Clio is not changed", matterPage, "Clio is not changed");
mustNotContain("matter page must not claim Clio close sync gating", matterPage, "Clio close sync must succeed before local close records are committed");
mustNotContain("matter page must not call blocked settlement close route", matterPage, 'fetch("/api/settlements/close"');
mustNotContain("matter page must not send old settlement close confirmation flag", matterPage, "confirmClosePaidSettlements: true");
mustNotContain("matter page must not send old payment close confirmation flag", matterPage, "confirmPaid: true");
mustNotContain("matter page must not say close workflow pending", matterPage, "local-first close workflow is built");
mustContain("package.json", packageJson, "verify:close-paid-settlements-safety");

if (failures) {
  console.error(`=== CLOSE PAID SETTLEMENTS GUARDED ROUTE BRIDGE FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== CLOSE PAID SETTLEMENTS GUARDED ROUTE BRIDGE PASSED ===");
console.log("Close Paid Settlements remains a convenience UI action, but it now routes through guarded Close Lawsuit. The legacy settlement close API remains blocked.");
