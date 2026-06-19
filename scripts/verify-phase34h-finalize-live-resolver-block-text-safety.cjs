const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (message) => console.log("PASS: " + message);
const fail = (message) => {
  failed = true;
  console.error("FAIL: " + message);
};

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
const pkg = JSON.parse(read("package.json"));

const finalize = read("app/api/documents/finalize/route.ts");
const smoke34g = read("scripts/smoke-phase34g-disabled-multisegment-resolver.cjs");
const verify34e = read("scripts/verify-phase34e-folder-taxonomy-planner-safety.cjs");
const verify34g = read("scripts/verify-phase34g-disabled-multisegment-resolver-smoke-safety.cjs");

const scriptName = "verify:phase34h-finalize-live-resolver-block-text-safety";
const current = "Live folder resolution remains disabled until finalize live folder resolution is explicitly enabled and smoke-tested.";
const stale = [
  "Live folder resolution is blocked in Phase 34E",
  "until the resolver supports the locked multi-segment folder taxonomy."
].join(" ");

if (pkg.scripts && pkg.scripts[scriptName] === "node scripts/verify-phase34h-finalize-live-resolver-block-text-safety.cjs") {
  pass("package script registered");
} else {
  fail("package script missing");
}

for (const [name, source] of [
  ["finalize route", finalize],
  ["Phase 34G smoke", smoke34g],
  ["Phase 34E verifier", verify34e],
]) {
  if (source.includes(current)) pass(name + " contains current block message");
  else fail(name + " missing current block message");

  if (!source.includes(stale)) pass(name + " does not contain stale Phase 34E resolver text");
  else fail(name + " still contains stale Phase 34E resolver text");
}

if (verify34g.includes(current)) pass("Phase 34G verifier checks current block message");
else fail("Phase 34G verifier does not check current block message");

if (verify34g.includes("smoke does not include enabled/stale token")) {
  pass("Phase 34G verifier treats stale phrase only as forbidden smoke content");
} else {
  fail("Phase 34G verifier stale-token check missing");
}

if (
  finalize.includes("resolverBlocked: true") &&
  finalize.includes("clioWrite: false") &&
  finalize.includes("uploadRewired: false") &&
  finalize.includes("databaseMutation: false")
) {
  pass("finalize still blocks live resolver without upload/db/clio write");
} else {
  fail("finalize resolver safety flags missing");
}

console.log("RESULT: Phase 34H finalize live resolver block text safety verifier");
if (failed) process.exit(1);
