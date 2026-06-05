#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";

const repo = process.cwd();
const backupRoot = path.join(repo, "backups", "indexes");
const cloudTargetPath = path.join(backupRoot, "CLOUD_TARGET.txt");
const latestPath = path.join(backupRoot, "LATEST_BACKUP.txt");

let failures = 0;
let warnings = 0;

function fail(message) {
  console.error(`FAIL: ${message}`);
  failures += 1;
}

function warn(message) {
  console.warn(`WARN: ${message}`);
  warnings += 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

function commandExists(command) {
  try {
    execSync(`command -v ${command}`, { encoding: "utf8", shell: "/bin/zsh", stdio: ["ignore", "pipe", "ignore"] });
    return true;
  } catch {
    return false;
  }
}

function existingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").trim();
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function hoursSinceIso(value) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return (Date.now() - timestamp) / (60 * 60 * 1000);
}

console.log("RESULT: dedicated Mac backup readiness verifier");
console.log("MODE=read-only");
console.log("RESTORE_EXECUTION=NO");
console.log("CLIO_CALLS=NO");
console.log(`HOSTNAME=${os.hostname()}`);
console.log(`PLATFORM=${os.platform()}`);
console.log(`REPO=${repo}`);

const pgDump = process.env.PG_DUMP_BIN || (commandExists("pg_dump") ? "pg_dump" : "") || existingPath([
  "/opt/homebrew/bin/pg_dump",
  "/opt/homebrew/opt/libpq/bin/pg_dump",
  "/opt/homebrew/opt/postgresql@17/bin/pg_dump",
  "/opt/homebrew/opt/postgresql@16/bin/pg_dump",
  "/opt/homebrew/opt/postgresql@15/bin/pg_dump",
  "/usr/local/bin/pg_dump",
  "/usr/local/opt/libpq/bin/pg_dump",
  "/usr/local/opt/postgresql@17/bin/pg_dump",
  "/usr/local/opt/postgresql@16/bin/pg_dump",
  "/usr/local/opt/postgresql@15/bin/pg_dump",
  "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_dump",
]);

const pgRestore = process.env.PG_RESTORE_BIN || (commandExists("pg_restore") ? "pg_restore" : "") || existingPath([
  "/opt/homebrew/bin/pg_restore",
  "/opt/homebrew/opt/libpq/bin/pg_restore",
  "/opt/homebrew/opt/postgresql@17/bin/pg_restore",
  "/opt/homebrew/opt/postgresql@16/bin/pg_restore",
  "/opt/homebrew/opt/postgresql@15/bin/pg_restore",
  "/usr/local/bin/pg_restore",
  "/usr/local/opt/libpq/bin/pg_restore",
  "/usr/local/opt/postgresql@17/bin/pg_restore",
  "/usr/local/opt/postgresql@16/bin/pg_restore",
  "/usr/local/opt/postgresql@15/bin/pg_restore",
  "/Applications/Postgres.app/Contents/Versions/latest/bin/pg_restore",
]);

if (!pgDump) fail("pg_dump was not found. Install PostgreSQL tools or set PG_DUMP_BIN.");
else pass(`pg_dump found: ${pgDump}`);

if (!pgRestore) fail("pg_restore was not found. Install PostgreSQL tools or set PG_RESTORE_BIN.");
else pass(`pg_restore found: ${pgRestore}`);

for (const scriptPath of [
  "scripts/backup-local-indexes.mjs",
  "scripts/backup-local-indexes-monitored.mjs",
  "scripts/restore-local-indexes-preview.mjs",
  "scripts/restore-local-indexes-postgres-guarded.mjs",
  "scripts/verify-admin-backup-prisma-model-archive-coverage.mjs",
  "scripts/verify-dropbox-backup-mirror-safety.mjs",
]) {
  if (fs.existsSync(path.join(repo, scriptPath))) pass(`Required script exists: ${scriptPath}`);
  else fail(`Required script missing: ${scriptPath}`);
}

if (!fs.existsSync(cloudTargetPath)) {
  fail(`CLOUD_TARGET.txt is not configured on this machine: ${cloudTargetPath}`);
} else {
  const cloudTarget = readText(cloudTargetPath);
  console.log(`CLOUD_TARGET=${cloudTarget}`);
  if (!path.isAbsolute(cloudTarget)) fail("CLOUD_TARGET.txt must contain an absolute local Dropbox sync path.");
  else if (!fs.existsSync(cloudTarget)) fail(`Configured cloud target directory does not exist: ${cloudTarget}`);
  else pass("Cloud backup target directory exists.");
}

if (!fs.existsSync(latestPath)) {
  fail(`LATEST_BACKUP.txt missing: ${latestPath}`);
} else {
  const latestDir = readText(latestPath);
  const manifestPath = path.join(latestDir, "manifest.json");
  console.log(`LATEST_BACKUP=${latestDir}`);

  for (const fileName of ["manifest.json", "database.dump", "schema.sql", "archive-list.txt"]) {
    const requiredPath = path.join(latestDir, fileName);
    if (fs.existsSync(requiredPath)) pass(`Latest backup file exists: ${fileName}`);
    else fail(`Latest backup file missing: ${requiredPath}`);
  }

  if (fs.existsSync(manifestPath)) {
    const manifest = readJson(manifestPath);
    const ageHours = hoursSinceIso(manifest.createdAt || "");
    console.log(`LATEST_BACKUP_CREATED_AT=${manifest.createdAt || ""}`);
    console.log(`LATEST_BACKUP_AGE_HOURS=${ageHours === null ? "UNKNOWN" : ageHours.toFixed(2)}`);

    if (ageHours === null) warn("Could not calculate latest backup age.");
    else if (ageHours > 1) warn("Latest backup is more than 1 hour old.");
    else pass("Latest backup is less than 1 hour old.");

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
}

for (const [label, filePath] of [
  ["Scheduled backup stdout log", path.join(backupRoot, "logs", "launchd.out.log")],
  ["Scheduled backup stderr log", path.join(backupRoot, "logs", "launchd.err.log")],
]) {
  if (fs.existsSync(filePath)) pass(`${label} exists.`);
  else warn(`${label} does not exist yet.`);
}

console.log(`WARNINGS=${warnings}`);
console.log(`FAILURES=${failures}`);

if (failures) process.exit(1);

console.log("PASS: Dedicated Mac backup readiness checks passed for this machine.");
