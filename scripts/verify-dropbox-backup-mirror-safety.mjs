#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repo = process.cwd();
const backupRoot = path.join(repo, "backups", "indexes");
const cloudTargetPath = path.join(backupRoot, "CLOUD_TARGET.txt");
const latestLocalPath = path.join(backupRoot, "LATEST_BACKUP.txt");

let failures = 0;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

console.log("RESULT: Dropbox backup mirror safety verifier");
console.log("MODE=read-only");
console.log("RESTORE_EXECUTION=NO");
console.log("CLIO_CALLS=NO");

if (!fs.existsSync(cloudTargetPath)) {
  fail(`Cloud target file is not configured on this machine: ${cloudTargetPath}`);
} else {
  pass("CLOUD_TARGET.txt exists.");
}

if (!fs.existsSync(latestLocalPath)) {
  fail(`Latest local backup pointer missing: ${latestLocalPath}`);
} else {
  pass("Local LATEST_BACKUP.txt exists.");
}

if (failures) {
  console.error(`FAILURES=${failures}`);
  process.exit(1);
}

const cloudTarget = readText(cloudTargetPath);
const latestLocalDir = readText(latestLocalPath);
const backupName = path.basename(latestLocalDir);
const mirroredDir = path.join(cloudTarget, backupName);
const mirroredLatestPath = path.join(cloudTarget, "LATEST_BACKUP.txt");

console.log(`CLOUD_TARGET=${cloudTarget}`);
console.log(`LOCAL_LATEST_BACKUP=${latestLocalDir}`);
console.log(`EXPECTED_MIRRORED_BACKUP=${mirroredDir}`);

if (!cloudTarget) {
  fail("CLOUD_TARGET.txt is empty.");
} else if (!path.isAbsolute(cloudTarget)) {
  fail("CLOUD_TARGET.txt must contain an absolute local Dropbox sync path.");
} else if (!fs.existsSync(cloudTarget)) {
  fail(`Configured cloud target directory does not exist: ${cloudTarget}`);
} else {
  pass("Configured cloud target directory exists.");
}

if (!fs.existsSync(latestLocalDir)) {
  fail(`Latest local backup directory does not exist: ${latestLocalDir}`);
} else {
  pass("Latest local backup directory exists.");
}

if (!fs.existsSync(mirroredLatestPath)) {
  fail(`Mirrored LATEST_BACKUP.txt missing: ${mirroredLatestPath}`);
} else {
  pass("Mirrored LATEST_BACKUP.txt exists.");
}

if (!fs.existsSync(mirroredDir)) {
  fail(`Mirrored latest backup directory missing: ${mirroredDir}`);
} else {
  pass("Mirrored latest backup directory exists.");
}

for (const fileName of ["manifest.json", "database.dump", "schema.sql", "archive-list.txt"]) {
  const localFile = path.join(latestLocalDir, fileName);
  const mirroredFile = path.join(mirroredDir, fileName);

  if (!fs.existsSync(localFile)) fail(`Local latest backup missing ${fileName}.`);
  else pass(`Local latest backup has ${fileName}.`);

  if (!fs.existsSync(mirroredFile)) fail(`Mirrored latest backup missing ${fileName}.`);
  else pass(`Mirrored latest backup has ${fileName}.`);
}

const mirroredManifestPath = path.join(mirroredDir, "manifest.json");
if (fs.existsSync(mirroredManifestPath)) {
  const manifest = readJson(mirroredManifestPath);
  const required = [
    ["databasePolicy.usesPgDump", manifest.databasePolicy?.usesPgDump, true],
    ["databasePolicy.usesPgRestoreForPreviewAndGuardedRestore", manifest.databasePolicy?.usesPgRestoreForPreviewAndGuardedRestore, true],
    ["databasePolicy.exportsAllPostgresTablesIndexesAndSchemaObjects", manifest.databasePolicy?.exportsAllPostgresTablesIndexesAndSchemaObjects, true],
    ["databasePolicy.futurePrismaModelsIncludedAutomatically", manifest.databasePolicy?.futurePrismaModelsIncludedAutomatically, true],
    ["databasePolicy.futureDatabaseIndexesIncludedAutomatically", manifest.databasePolicy?.futureDatabaseIndexesIncludedAutomatically, true],
    ["databasePolicy.usesPrismaClient", manifest.databasePolicy?.usesPrismaClient, false],
    ["documentFilePolicy.backsUpActualDocumentFolders", manifest.documentFilePolicy?.backsUpActualDocumentFolders, false],
    ["documentFilePolicy.pullsDocumentsFromClio", manifest.documentFilePolicy?.pullsDocumentsFromClio, false],
    ["documentFilePolicy.documentVault", manifest.documentFilePolicy?.documentVault, "Clio"],
    ["documentFilePolicy.localDocumentMetadataRowsMayBeIncluded", manifest.documentFilePolicy?.localDocumentMetadataRowsMayBeIncluded, true],
  ];

  for (const [label, actual, expected] of required) {
    if (actual !== expected) fail(`${label} expected ${JSON.stringify(expected)} but found ${JSON.stringify(actual)}`);
    else pass(`${label}=${JSON.stringify(expected)}`);
  }
}

console.log(`FAILURES=${failures}`);

if (failures) process.exit(1);

console.log("PASS: Dropbox backup mirror is configured and latest backup is mirrored with required files.");
