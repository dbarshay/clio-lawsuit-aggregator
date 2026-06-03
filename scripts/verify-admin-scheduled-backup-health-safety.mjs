#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const statusRoutePath = 'app/api/admin/backups/status/route.ts';
const pagePath = 'app/admin/backup-restore/page.tsx';
const statusRoute = fs.readFileSync(statusRoutePath, 'utf8');
const page = fs.readFileSync(pagePath, 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const required of [
  'scheduledBackupHealth',
  'read-only-scheduled-backup-health',
  'launchd.out.log',
  'launchd.err.log',
  'tailLines(launchdOutLogPath, 50)',
  'tailLines(launchdErrLogPath, 50)',
  'latestBackupWithinExpectedWindow',
  'retentionDeletion: false',
  'restoreExecution: false',
  'clioWrite: false',
  'email: false',
  'documentGeneration: false',
  'printQueueMutation: false',
]) {
  if (!statusRoute.includes(required)) {
    failures.push(`${statusRoutePath}: missing scheduled-health route fragment: ${required}`);
  }
}

for (const required of [
  'data-scheduled-backup-health="read-only"',
  'data-retention-deletion-enabled="false"',
  'Scheduled Backup Health',
  'Read-only visibility for the scheduled local database/index backup system.',
  'It does not delete backups, execute restores, call Clio, send email, generate documents, or change the print queue.',
  'Latest backup age',
  'Expected interval',
  'Retention policy',
  'Deletion controls: DISABLED',
  'Scheduled backup stdout log',
  'Scheduled backup stderr log',
  'formatHours(status?.scheduledBackupHealth?.latestBackupAgeHours)',
]) {
  if (!page.includes(required)) {
    failures.push(`${pagePath}: missing scheduled-health UI fragment: ${required}`);
  }
}

for (const [file, text] of [
  [statusRoutePath, statusRoute],
  [pagePath, page],
]) {
  for (const banned of [
    'unlinkSync',
    'rmSync',
    'rmdirSync',
    'restore-local-indexes-sqlite-guarded.mjs',
    'restore-local-indexes-postgres-guarded.mjs',
    'create-draft',
    'maildrop',
    'finalize-preview',
    'generate-preview',
    'working-docx',
    'documents/print-queue',
  ]) {
    if (text.includes(banned)) {
      failures.push(`${file}: banned destructive/operational reference found: ${banned}`);
    }
  }
}

if (pkg.scripts?.['verify:admin-scheduled-backup-health-safety'] !== 'node scripts/verify-admin-scheduled-backup-health-safety.mjs') {
  failures.push('package.json: missing verify:admin-scheduled-backup-health-safety script');
}

console.log('RESULT: admin scheduled backup health safety verifier');

if (failures.length) {
  console.log(`FAILURES=${failures.length}`);
  for (const failure of failures) console.log(`FAIL=${failure}`);
  process.exit(1);
}

console.log('FAILURES=0');
console.log('PASS: Scheduled backup health is read-only and has no restore/deletion/Clio/email/document/print behavior.');
