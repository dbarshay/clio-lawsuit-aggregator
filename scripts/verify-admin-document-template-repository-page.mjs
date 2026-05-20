#!/usr/bin/env node
import fs from "fs";

const pagePath = "app/admin/document-templates/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const checks = [
  ["admin page exists", fs.existsSync(pagePath)],
  ["admin-only marker exists", page.includes('data-barsh-admin-document-template-repository="true"')],
  ["admin heading exists", page.includes("Document Template Repository")],
  ["uses templates API", page.includes("/api/documents/templates?category=")],
  ["category filters exist", page.includes('"settlement"') && page.includes('"lawsuit"') && page.includes('"direct_matter"')],
  ["read-only copy exists", page.includes("read-only") || page.includes("Read-only")],
  ["no edit controls", !page.includes("Save Template") && !page.includes("Delete Template") && !page.includes("Upload Template")],
  ["no Clio writes", page.includes("write Clio data") && !page.includes("/api/clio")],
  ["merge fields displayed", page.includes("mergeFields") && page.includes("Merge Fields")],
  ["repository source displayed", page.includes("repositorySource") && page.includes("Repository Source")],
];

let failed = false;
for (const [label, ok] of checks) {
  if (ok) console.log(`PASS: ${label}`);
  else {
    console.log(`FAIL: ${label}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("PASS: admin document template repository page verifier");
