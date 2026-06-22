const fs = require("fs");
const route = fs.readFileSync("app/api/documents/finalize/route.ts", "utf8");

function pass(msg) { console.log("PASS: " + msg); }
function fail(msg) { console.error("FAIL: " + msg); process.exitCode = 1; }

const required = [
  "const isDirectMatterLiveFinalizeRequest =",
  'uploadTargetMode === "direct-matter"',
  "confirmUpload === true",
  "singleMasterDryRun !== true",
  "BARSH_DIRECT_MATTER_CLIO_LIVE_FINALIZE_ENABLED",
  "direct-live-server-kill-switch",
  "serverLiveFinalizeEnabled: false",
  "Direct matter live finalize is disabled by server configuration.",
  "isAdminRequestAuthorized",
  "adminUnauthorizedJson(403)",
  "useDirectFinalizePreview",
  "directMatterId",
  "directMatterDisplayNumber",
  "masterLawsuitId",
];

for (const token of required) {
  if (route.includes(token)) pass("finalize route contains " + token);
  else fail("finalize route missing " + token);
}

const predicateStart = route.indexOf("const isDirectMatterLiveFinalizeRequest =");
const predicateEnd = route.indexOf(";", predicateStart);
const predicate = predicateStart >= 0 && predicateEnd >= 0 ? route.slice(predicateStart, predicateEnd + 1) : "";

if (predicate.includes("useDirectFinalizePreview")) {
  fail("direct-live kill-switch predicate must not depend on useDirectFinalizePreview");
} else {
  pass("direct-live kill-switch predicate does not depend on useDirectFinalizePreview");
}

if (predicate.includes('uploadTargetMode === "direct-matter"') && predicate.includes("confirmUpload === true") && predicate.includes("singleMasterDryRun !== true")) {
  pass("direct-live predicate is based on direct target + confirmed live upload + non-dry-run");
} else {
  fail("direct-live predicate missing required direct/live/non-dry-run terms");
}

const killIf = route.indexOf("if (isDirectMatterLiveFinalizeRequest && !directMatterLiveFinalizeServerEnabled)");
const adminIf = route.indexOf("if (isDirectMatterLiveFinalizeRequest && !isAdminRequestAuthorized");
const previewLoad = route.indexOf("const preview =");
const workingDoc = route.indexOf("Finalize Document now requires a saved working Word document");

if (killIf >= 0 && adminIf >= 0 && killIf < adminIf) pass("server kill switch remains before admin authorization");
else fail("server kill switch should remain before admin authorization");

if (killIf >= 0 && previewLoad >= 0 && killIf < previewLoad) pass("server kill switch remains before preview/document handling");
else fail("server kill switch should remain before preview/document handling");

if (killIf >= 0 && workingDoc >= 0 && killIf < workingDoc) pass("server kill switch remains before working-document requirement");
else fail("server kill switch should remain before working-document requirement");

const markerCount = (route.match(/direct-live-server-kill-switch/g) || []).length;
if (markerCount === 1) pass("exactly one direct-live server kill-switch marker remains");
else fail("expected exactly one direct-live server kill-switch marker, found " + markerCount);

if (process.exitCode) {
  console.error("RESULT: Phase 44O direct-live kill-switch condition safety verifier failed");
  process.exit(process.exitCode);
}
console.log("RESULT: Phase 44O direct-live kill-switch condition safety verifier passed");
