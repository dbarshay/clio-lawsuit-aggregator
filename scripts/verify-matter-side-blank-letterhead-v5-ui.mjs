import fs from "fs";

const matterPage = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const workingDocxRoute = fs.readFileSync("app/api/documents/working-docx/route.ts", "utf8");
const directPreviewRoute = fs.readFileSync("app/api/documents/direct-finalize-preview/route.ts", "utf8");
const templateGenerateRoute = fs.readFileSync("app/api/documents/templates/generate-preview/route.ts", "utf8");

let failed = false;
function pass(message) {
  console.log("PASS:", message);
}
function fail(message) {
  failed = true;
  console.error("FAIL:", message);
}
function mustContain(label, text, token) {
  if (text.includes(token)) pass(label);
  else fail(`${label} missing token: ${token}`);
}
function mustNotContain(label, text, token) {
  if (!text.includes(token)) pass(label);
  else fail(`${label} contains forbidden token: ${token}`);
}

mustContain("direct matter popup includes Blank Letterhead option key", matterPage, 'key: "blank-letterhead"');
mustContain("direct matter popup includes Blank Letterhead label", matterPage, 'label: "Blank Letterhead"');
mustContain("direct matter popup identifies local repository source", matterPage, "local Barsh Matters template repository");
mustContain("direct matter popup selection passes selected template key", matterPage, "documentKeys: [selectedTemplate.key]");
mustContain("direct matter edit action uses working DOCX route", matterPage, 'fetch("/api/documents/working-docx"');
mustContain("direct matter popup standard header remains", matterPage, 'data-barsh-direct-document-generation-header-standard="true"');
mustContain("direct matter popup footer remains", matterPage, 'data-barsh-direct-document-generation-footer-actions="true"');
mustContain("working-docx accepts requested documentKeys", workingDocxRoute, "const requestedKeys = asStringArray(body?.documentKeys)");
mustContain("working-docx recognizes stored DB DOCX source", workingDocxRoute, 'clean(selectedDocument.repositorySource) === "barsh-matters-db"');
mustContain("working-docx recognizes db-docx-base64 storage kind", workingDocxRoute, 'clean(selectedDocument.storageKind) === "db-docx-base64"');
mustContain("direct-finalize-preview loads DB current version storage kind", directPreviewRoute, 'currentVersion?.storageKind === "db-docx-base64"');
mustContain("direct-finalize-preview marks repository source DB", directPreviewRoute, 'repositorySource: "barsh-matters-db"');
mustContain("generate-preview still selects stored DB DOCX versions", templateGenerateRoute, 'where: { storageKind: "db-docx-base64" }');
mustContain("generate-preview still resolves signer email/user", templateGenerateRoute, "signerEmail");
mustNotContain("direct matter popup must not use generated preview file as source", matterPage, "Generated Preview.docx");

console.log("RESULT: matter-side Blank Letterhead v5 UI bridge verifier");
if (failed) process.exit(1);
