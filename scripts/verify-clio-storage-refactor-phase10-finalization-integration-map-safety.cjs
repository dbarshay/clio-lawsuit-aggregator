#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");

let failed = false;
function pass(msg) { console.log("PASS: " + msg); }
function fail(msg) { console.error("FAIL: " + msg); failed = true; }
function read(file) { if (!fs.existsSync(file)) { fail(file + " missing"); return ""; } return fs.readFileSync(file, "utf8"); }

const doc = read("docs/implementation/clio-storage-refactor-phase10-finalization-integration-map.md");
const phase9Route = read("app/api/documents/clio-single-master-upload-target-preview/route.ts");
const finalize = read("app/api/documents/finalize/route.ts");
const finalizePreview = read("app/api/documents/finalize-preview/route.ts");
const directPreview = read("app/api/documents/direct-finalize-preview/route.ts");
const pkg = JSON.parse(read("package.json") || "{}");

for (const token of ["Document Finalization Integration Map", "finalize/route.ts", "finalize-preview/route.ts", "direct-finalize-preview/route.ts", "clio-single-master-upload-target-preview", "No existing document finalization route is rewired"]) {
  if (doc.includes(token)) pass("Phase 10 doc contains " + token);
  else fail("Phase 10 doc missing " + token);
}

if (phase9Route.includes("buildClioSingleMasterUploadTargetPreview") && phase9Route.includes("export async function GET")) pass("Phase 9 preview API remains present"); else fail("Phase 9 preview API missing or changed");

const forbiddenRewireTokens = ["buildClioSingleMasterUploadTargetPreview", "clioSingleMasterUploadTargetPreview", "clio-single-master-upload-target-preview", "buildClioStorageFolderResolutionPreview", "buildClioStorageTargetPlan"];
for (const [name, source] of [["finalize route", finalize], ["finalize-preview route", finalizePreview], ["direct-finalize-preview route", directPreview]]) {
  const hit = forbiddenRewireTokens.find((token) => source.includes(token));
  if (!hit) pass(name + " is not rewired to single-master preview/helper");
  else fail(name + " appears rewired through token " + hit);
}

const forbiddenDocTokens = ["createFolder", "folders.json", "method: \"POST\"", "method: \"PATCH\"", "method: \"PUT\"", "method: \"DELETE\"", "prisma.$executeRaw"];
if (!forbiddenDocTokens.some((token) => doc.includes(token))) pass("Phase 10 doc has no operational write instructions"); else fail("Phase 10 doc appears to include operational write instructions");

const scriptName = "verify:clio-storage-refactor-phase10-finalization-integration-map-safety";
const expectedScript = "node scripts/verify-clio-storage-refactor-phase10-finalization-integration-map-safety.cjs";
if ((pkg.scripts || {})[scriptName] === expectedScript) pass("package script registered"); else fail("package script missing or incorrect");

try { cp.execFileSync("npm", ["run", "verify:clio-storage-refactor-phase8-upload-target-preview-safety"], { stdio: "inherit" }); pass("Phase 8 verifier still passes"); } catch { fail("Phase 8 verifier failed"); }
try { cp.execFileSync("npm", ["run", "verify:clio-storage-refactor-phase9-upload-target-preview-api-safety"], { stdio: "inherit" }); pass("Phase 9 verifier still passes"); } catch { fail("Phase 9 verifier failed"); }

if (failed) process.exit(1);
console.log("RESULT: Clio storage refactor Phase 10 finalization integration map verifier passed");
