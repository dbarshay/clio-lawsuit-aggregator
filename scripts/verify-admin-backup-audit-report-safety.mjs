#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const pagePath = 'app/admin/backup-restore/page.tsx';
const page = fs.readFileSync(pagePath, 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const required of [
  'data-backup-audit-report="read-only"',
  'data-client-side-csv-export="true"',
  'data-server-side-export-enabled="false"',
  'Backup Audit Report',
  'Read-only audit report generated from the backup metadata already loaded on this page.',
  'Copy Audit Report',
  'Download Audit CSV',
  'function backupAuditSummary',
  'function backupAuditFlags',
  'function buildBackupAuditReport',
  'function buildBackupAuditCsv',
  'function csvEscape',
  'navigator.clipboard.writeText(buildBackupAuditReport(status))',
  'new Blob([csv], { type: "text/csv;charset=utf-8" })',
  'URL.createObjectURL(blob)',
  'Backup audit CSV generated in the browser.',
  'server-side export files',
]) {
  if (!page.includes(required)) {
    failures.push(`${pagePath}: missing audit report fragment: ${required}`);
  }
}

for (const banned of [
  'fs.writeFile',
  'writeFileSync',
  'createWriteStream',
  'restore-local-indexes-sqlite-guarded.mjs',
  'restore-local-indexes-postgres-guarded.mjs',
  'unlinkSync',
  'rmSync',
  'rmdirSync',
  'create-draft',
  'maildrop',
  'finalize-preview',
  'generate-preview',
  'working-docx',
  'documents/print-queue',
  'runRetentionCleanup',
  'deleteBackup',
  'executeRestore',
  'runRestoreExecution',
]) {
  if (page.includes(banned)) {
    failures.push(`${pagePath}: banned server/destructive/operational reference found: ${banned}`);
  }
}

if (pkg.scripts?.['verify:admin-backup-audit-report-safety'] !== 'node scripts/verify-admin-backup-audit-report-safety.mjs') {
  failures.push('package.json: missing verify:admin-backup-audit-report-safety script');
}

console.log('RESULT: admin backup audit report safety verifier');

if (failures.length) {
  console.log(`FAILURES=${failures.length}`);
  for (const failure of failures) console.log(`FAIL=${failure}`);
  process.exit(1);
}

console.log('FAILURES=0');
console.log('PASS: Backup audit report is read-only with client-side copy/CSV only and no restore/delete/Clio/email/document/print behavior.');
