#!/usr/bin/env node
const fs = require("fs");
const cp = require("child_process");

let failed = false;
function pass(msg) { console.log("PASS: " + msg); }
function fail(msg) { console.error("FAIL: " + msg); failed = true; }
function read(file) { if (!fs.existsSync(file)) { fail(file + " missing"); return ""; } return fs.readFileSync(file, "utf8"); }

const route = read("app/api/documents/clio-single-master-upload-target-preview/route.ts");
const doc = read("docs/implementation/clio-storage-refactor-phase9-upload-target-preview-api.md");
const pkg = JSON.parse(read("package.json") || "{}");

for (const token of ["buildClioSingleMasterUploadTargetPreview", "clio-single-master-upload-target-preview", "previewOnly: true", "uploadRewired: false", "noExistingRoutesRewired: true", "noClioCalls: true", "noFolderCreation: true", "noDocumentUploads: true", "noDatabaseMutation: true"]) {
  if (route.includes(token) || doc.includes(token)) pass("Phase 9 contains " + token);
  else fail("Phase 9 missing " + token);
}

if (route.includes("export async function GET") && !route.includes("export async function POST") && !route.includes("export async function PUT") && !route.includes("export async function PATCH") && !route.includes("export async function DELETE")) pass("Phase 9 route is GET-only"); else fail("Phase 9 route is not GET-only");

const forbidden = ["clioFetch", "fetch(", "uploadBufferToClioMatterDocuments", "listClioMatterDocuments", "findExistingClioDocumentsByFilename", "prisma.", "documentFinalization.create", "uploadBuffer"];
if (!forbidden.some((token) => route.includes(token))) pass("Phase 9 route has no Clio/database/document IO"); else fail("Phase 9 route contains operational IO");

const finalize = read("app/api/documents/finalize/route.ts");
if (!finalize.includes("clioSingleMasterUploadTargetPreview") && !finalize.includes("clio-single-master-upload-target-preview")) pass("finalize route not rewired"); else fail("finalize route appears rewired");

const scriptName = "verify:clio-storage-refactor-phase9-upload-target-preview-api-safety";
const expectedScript = "node scripts/verify-clio-storage-refactor-phase9-upload-target-preview-api-safety.cjs";
if ((pkg.scripts || {})[scriptName] === expectedScript) pass("package script registered"); else fail("package script missing or incorrect");

try { cp.execFileSync("npm", ["run", "verify:clio-storage-refactor-phase8-upload-target-preview-safety"], { stdio: "inherit" }); pass("Phase 8 verifier still passes"); } catch { fail("Phase 8 verifier failed"); }

if (failed) process.exit(1);
console.log("RESULT: Clio storage refactor Phase 9 upload-target preview API verifier passed");
