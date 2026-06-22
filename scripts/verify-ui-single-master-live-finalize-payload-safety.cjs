const fs = require("fs");

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function mustContain(label, source, token) {
  if (source.includes(token)) pass(label);
  else fail(`${label} missing token: ${token}`);
}

function mustNotContain(label, source, token) {
  if (!source.includes(token)) pass(label);
  else fail(`${label} contains forbidden token: ${token}`);
}

function extractBlock(source, startNeedle) {
  const start = source.indexOf(startNeedle);
  if (start < 0) return "";
  const endCandidates = [
    source.indexOf("\n      });", start),
    source.indexOf("\n    });", start),
    source.indexOf("\n  });", start),
  ].filter((n) => n > start);
  const end = endCandidates.length ? Math.min(...endCandidates) + 12 : Math.min(source.length, start + 2000);
  return source.slice(start, end);
}

const pagePath = "app/matters/page.tsx";
const routePath = "app/api/documents/finalize/route.ts";
const workingPath = "app/api/documents/working-docx/route.ts";

for (const path of [pagePath, routePath, workingPath]) {
  if (!fs.existsSync(path)) fail(`required file exists: ${path}`);
  else pass(`required file exists: ${path}`);
}

const page = fs.readFileSync(pagePath, "utf8");
const route = fs.readFileSync(routePath, "utf8");
const working = fs.readFileSync(workingPath, "utf8");

const masterFinalizeFn = page.match(/async function finalizeMasterDocumentFromStep2[\s\S]*?\n  async function finalizeMasterSettlementDocumentPlaceholder/)?.[0] || "";
if (masterFinalizeFn) pass("master/lawsuit finalize UI function located");
else fail("master/lawsuit finalize UI function not located");

const masterFinalizePayload = extractBlock(masterFinalizeFn, 'body: JSON.stringify({');
if (masterFinalizePayload) pass("master/lawsuit finalize JSON payload located");
else fail("master/lawsuit finalize JSON payload not located");

for (const token of [
  'masterLawsuitId',
  'uploadTargetMode: "master-lawsuit"',
  'useSingleMasterClioStorage: true',
  'confirmUpload: true',
  'singleMasterDryRun: false',
  'singleMasterResolveFolders: true',
  'documentKeys: [selectedTemplate.key]',
  'workingDocumentDriveItemId: workingDocumentForFinalization?.driveItemId || ""',
  'workingDocumentKey: masterDocumentFinalizationResult?.selectedDocument?.key || selectedTemplate.key',
]) {
  mustContain(`master/lawsuit confirmed finalize payload includes ${token}`, masterFinalizePayload, token);
}

mustNotContain(
  "master/lawsuit confirmed finalize payload does not regress to dry-run true",
  masterFinalizePayload,
  "singleMasterDryRun: true"
);

const directLivePayloadFn = page.match(/function buildDirectMatterLiveFinalizePayloadFromSelection[\s\S]*?\n  async function/)?.[0] ||
  page.match(/const buildDirectMatterLiveFinalizePayloadFromSelection[\s\S]*?\n  async function/)?.[0] ||
  page;
for (const token of [
  'uploadTargetMode: "direct-matter"',
  'directMatterDisplayNumber',
  'useSingleMasterClioStorage: true',
  'confirmUpload: true',
  'singleMasterDryRun: false',
  'singleMasterResolveFolders: true',
  'workingDocumentDriveItemId',
  'workingDocumentKey',
]) {
  mustContain(`direct confirmed finalize UI shape still includes ${token}`, directLivePayloadFn, token);
}

for (const token of [
  'const useSingleMasterClioStorage = body?.useSingleMasterClioStorage === true',
  'const singleMasterDryRun = body?.singleMasterDryRun !== false',
  'const singleMasterResolveFolders = body?.singleMasterResolveFolders === true',
  'parentType: uploadRewiredToSingleMasterFolder ? "Folder" : "Matter"',
  'parentId: uploadRewiredToSingleMasterFolder ? Number(singleMasterUploadFolderId) : undefined',
  'uploadRewired: uploadRewiredToSingleMasterFolder',
  'fullyUploaded',
]) {
  mustContain(`finalize route preserves single-master live upload contract ${token}`, route, token);
}

for (const token of [
  'singleMasterClioStorage',
  'useSingleMasterClioStorage',
  'uploadTargetMode',
]) {
  mustContain(`working-docx route preserves single-master preview propagation ${token}`, working, token);
}

for (const forbidden of [
  'legacy Clio matter shell',
  'MailDrop',
  'Clio shell workflow',
]) {
  mustNotContain(`UI/API verifier does not introduce forbidden legacy wording ${forbidden}`, masterFinalizePayload, forbidden);
}

if (process.exitCode) {
  console.error("RESULT: UI single-master live finalize payload verifier failed");
  process.exit(process.exitCode);
}

console.log("RESULT: UI single-master live finalize payload verifier passed");
