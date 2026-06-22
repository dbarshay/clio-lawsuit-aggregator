const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const packet = fs.readFileSync(path.join(process.cwd(), "app/api/documents/packet/route.ts"), "utf8");

if (!packet.includes('blockingErrors.push("No master matter found for MASTER_LAWSUIT_ID.")')) {
  pass("packet route no longer blocks solely because no master matter row exists");
} else {
  fail("packet route still blocks on missing master matter row");
}

if (packet.includes("hasLocalOnlyLawsuit")) pass("packet route tracks local-only lawsuit availability");
else fail("packet route missing hasLocalOnlyLawsuit flag");

if (packet.includes('source: "local-lawsuit-row"')) pass("packet route builds local masterMatter from local Lawsuit row");
else fail("packet route missing local Lawsuit masterMatter fallback");

console.log("RESULT: local-only packet generation safety verifier");
if (failed) process.exit(1);
