import fs from "fs";

const page = fs.readFileSync("app/matters/page.tsx", "utf8");

const required = [
  'const category = mode === "settlement" ? "settlement" : "all";',
  "loadMasterDocumentRepositoryTemplates",
  "/api/documents/templates?category=",
  "lawsuit mode loads all stored local DOCX templates first",
  "storedRepositoryDocumentOptions",
  "...storedRepositoryDocumentOptions",
];

const forbidden = [
  'const category = mode === "settlement" ? "settlement" : "lawsuit";',
  "fetch(`/api/documents/finalize",
  "fetch(`/api/graph/create-draft",
  "fetch(`/api/documents/print-queue",
  "sendMail",
];

const failures = [];

for (const marker of required) {
  if (!page.includes(marker)) failures.push(`missing required marker: ${marker}`);
}

const loadStart = page.indexOf("async function loadMasterDocumentRepositoryTemplates");
const loadEnd = page.indexOf("async function launchMasterDocumentGenerationDialog");
const loadSection = loadStart >= 0 && loadEnd > loadStart ? page.slice(loadStart, loadEnd) : "";

for (const marker of forbidden) {
  if ((marker.includes("category") ? page : loadSection).includes(marker)) {
    failures.push(`forbidden marker present: ${marker}`);
  }
}

if (failures.length) {
  console.error("FAIL: master template repository load category verifier failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: master document generation loads all stored local DOCX templates in lawsuit mode while preserving settlement category mode.");
