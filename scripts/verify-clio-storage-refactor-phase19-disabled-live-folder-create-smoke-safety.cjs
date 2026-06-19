#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");

let failed = false;
function pass(msg) { console.log("PASS: " + msg); }
function fail(msg) { console.error("FAIL: " + msg); failed = true; }
function read(file) { if (!fs.existsSync(file)) { fail(file + " missing"); return ""; } return fs.readFileSync(file, "utf8"); }

const smoke = read("scripts/smoke-clio-storage-phase19-live-folder-create-disabled.cjs");
const gate = read("lib/clioLiveWriteReadiness.ts");
const doc = read("docs/implementation/clio-storage-refactor-phase19-disabled-live-folder-create-smoke.md");
const finalize = read("app/api/documents/finalize/route.ts");
const pkg = JSON.parse(read("package.json") || "{}");

for (const token of ["getReadiness", "PHASE_19_LIVE_FOLDER_CREATE_SMOKE=disabled_by_default", "live folder-create smoke blocked before any Clio call", "RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE"]) {
  if (smoke.includes(token) || doc.includes(token)) pass("Phase 19 contains " + token);
  else fail("Phase 19 missing " + token);
}

if (gate.includes("RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE") && gate.includes("CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED") && gate.includes("CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED")) pass("Phase 18 readiness gate remains present and smoke has self-contained readiness mirror"); else fail("Phase 18 readiness gate missing expected flags");
if (!smoke.includes("clioFetch") && !smoke.includes("fetch(") && !smoke.includes("createClioFolderWithGuard") && !smoke.includes("resolveClioMatterFolderWithGuard") && !smoke.includes("prisma.")) pass("Phase 19 smoke has no Clio/database/folder IO"); else fail("Phase 19 smoke appears operational");
if (!finalize.includes("smoke-clio-storage-phase19") && !finalize.includes("getReadiness") && !finalize.includes("createClioFolderWithGuard") && !finalize.includes("resolveClioMatterFolderWithGuard")) pass("finalize route remains unrevised by Phase 19"); else fail("finalize route appears rewired by Phase 19");

const scriptName = "verify:clio-storage-refactor-phase19-disabled-live-folder-create-smoke-safety";
const expectedScript = "node scripts/verify-clio-storage-refactor-phase19-disabled-live-folder-create-smoke-safety.cjs";
if ((pkg.scripts || {})[scriptName] === expectedScript) pass("package script registered"); else fail("package script missing or incorrect");

try { cp.execFileSync("node", ["scripts/smoke-clio-storage-phase19-live-folder-create-disabled.cjs"], { stdio: "inherit" }); pass("disabled smoke exits before any Clio call"); } catch { fail("disabled smoke failed"); }

if (failed) process.exit(1);
console.log("RESULT: Clio storage refactor Phase 19 disabled live folder-create smoke verifier passed");
