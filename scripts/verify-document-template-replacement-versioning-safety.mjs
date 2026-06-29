import fs from "node:fs";

const route = fs.readFileSync("app/api/documents/templates/replace-version/route.ts", "utf8");
const page = fs.readFileSync("app/admin/document-templates/[key]/page.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };

must(route.includes("document-template-replace-version"), "replacement route identifies document-template-replace-version action");
must(route.includes("req.formData()"), "replacement route can parse multipart upload payloads");
must(route.includes('storageKind: "db-docx-base64"'), "replacement route stores DOCX base64 content");
must(route.includes("tx.documentTemplateVersion.create"), "replacement route creates DocumentTemplateVersion records");
must(route.includes("versionNumber: nextVersionNumber"), "replacement route creates a new version");
must(route.includes("currentVersionId: version.id"), "replacement route updates currentVersionId to new version");
must(route.includes("preservesPriorVersions: true"), "replacement route safety states prior versions are preserved");
must(route.includes("clioWrites: false"), "replacement route safety blocks Clio writes");
must(route.includes("graphWrites: false"), "replacement route safety blocks Graph writes");
must(route.includes("emailsSent: false"), "replacement route safety blocks emails");
must(route.includes("printQueued: false"), "replacement route safety blocks print queue");
must(route.includes("maxWait") && route.includes("timeout"), "replacement route transaction uses safety timeouts");

must(page.includes('data-barsh-admin-document-template-replacement-workflow="true"'), "template detail page exposes replacement workflow marker");
must(page.includes("Preview Replacement"), "template detail page has Preview Replacement button");
must(page.includes("Confirm Replacement Version"), "template detail page has Confirm Replacement Version button");
must(page.includes('fetch("/api/documents/templates/replace-version"'), "template detail page calls replacement route");
must(page.includes("Prior versions are preserved"), "template detail page warns that prior versions are preserved");
must(page.includes("new DocumentTemplateVersion"), "template detail page explains new DocumentTemplateVersion behavior");
must(pkg.scripts?.["verify:document-template-replacement-versioning-safety"] === "node scripts/verify-document-template-replacement-versioning-safety.mjs", "package has replacement versioning verifier script");

if (failures.length) {
  console.error("Document template replacement versioning safety verification failed.");
  for (const failure of failures) console.error("FAIL: " + failure);
  process.exit(1);
}
console.log("PASS: document template replacement versioning safety verification passed");
