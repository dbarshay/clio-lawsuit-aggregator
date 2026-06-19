#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");

let failed = false;
function pass(msg) { console.log("PASS: " + msg); }
function fail(msg) { console.error("FAIL: " + msg); failed = true; }
function read(file) { if (!fs.existsSync(file)) { fail(file + " missing"); return ""; } return fs.readFileSync(file, "utf8"); }

const resolver = read("lib/clioStorageFolderResolution.ts");
const doc = read("docs/implementation/clio-storage-refactor-phase5-folder-resolution-preview.md");
const pkg = JSON.parse(read("package.json") || "{}");

for (const token of ["buildClioStorageFolderResolutionPreview", "buildClioStorageTargetPlan", "preview_only", "verify-master-matter", "find-or-create-bucket-folder", "find-or-create-matter-folder", "return-matter-folder-upload-target"]) {
  if (resolver.includes(token) || doc.includes(token)) pass("Phase 5 contains " + token);
  else fail("Phase 5 missing " + token);
}

for (const token of ["createsFolders: false", "callsClio: false", "uploadsDocuments: false", "mutatesDatabase: false"]) {
  if (resolver.includes(token)) pass("preview explicitly declares " + token);
  else fail("preview missing " + token);
}

const forbiddenTokens = ["clioFetch", "fetch(", "uploadBufferToClioMatterDocuments", "listClioMatterDocuments", "findExistingClioDocumentsByFilename", "prisma.", "migration.sql"];
if (!forbiddenTokens.some((token) => resolver.includes(token))) pass("folder-resolution preview has no Clio/database/document IO"); else fail("folder-resolution preview contains operational IO");

const scriptName = "verify:clio-storage-refactor-phase5-folder-resolution-preview-safety";
const expectedScript = "node scripts/verify-clio-storage-refactor-phase5-folder-resolution-preview-safety.cjs";
if ((pkg.scripts || {})[scriptName] === expectedScript) pass("package script registered"); else fail("package script missing or incorrect");

try { cp.execFileSync("node", ["scripts/verify-clio-storage-refactor-phase2-setup-safety.cjs"], { stdio: "inherit" }); pass("Phase 2 verifier still passes"); } catch { fail("Phase 2 verifier failed"); }
try { cp.execFileSync("npm", ["run", "verify:clio-storage-refactor-phase3-config-contract-safety"], { stdio: "inherit" }); pass("Phase 3 verifier still passes"); } catch { fail("Phase 3 verifier failed"); }
try { cp.execFileSync("npm", ["run", "verify:clio-storage-refactor-phase4-storage-plan-safety"], { stdio: "inherit" }); pass("Phase 4 verifier still passes"); } catch { fail("Phase 4 verifier failed"); }

if (failed) process.exit(1);
console.log("RESULT: Clio storage refactor Phase 5 folder-resolution preview verifier passed");
