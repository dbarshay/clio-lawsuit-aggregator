#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const pagePath = 'app/admin/backup-restore/page.tsx';
const page = fs.readFileSync(pagePath, 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const required of [
  'type BackupHealthWarning',
  'function backupNameFromUrl()',
  'function adminBackupRestoreUrlForBackup',
  'function backupNameFromPath',
  'function currentBackupHealthWarnings',
  'data-backup-health-warnings="display-only"',
  'Latest backup is more than 2 hours old.',
  'Latest backup manifest is missing or unreadable.',
  'Latest backup database.dump is missing.',
  'Latest backup schema.sql is missing.',
  'Display-only warnings',
  'window.history.pushState({ barshMattersAdminBackupRestoreBackup: true }',
  'window.addEventListener("popstate", applySelectedBackupFromUrl)',
  'Copy Backup Path',
  'navigator.clipboard.writeText(selectedBackup)',
]) {
  if (!page.includes(required)) {
    failures.push(`${pagePath}: missing required fragment: ${required}`);
  }
}

for (const banned of [
  'restore-local-indexes-sqlite-guarded.mjs',
  'restore-local-indexes-postgres-guarded.mjs',
  'finalize-preview',
  'generate-preview',
  'working-docx',
  'create-draft',
  'maildrop',
]) {
  if (page.includes(banned)) {
    failures.push(`${pagePath}: banned operational reference found: ${banned}`);
  }
}

if (pkg.scripts?.['verify:admin-backup-restore-health-url-safety'] !== 'node scripts/verify-admin-backup-restore-health-url-safety.mjs') {
  failures.push('package.json: missing verify:admin-backup-restore-health-url-safety script');
}

console.log('RESULT: admin backup/restore health + URL safety verifier');

if (failures.length) {
  console.log(`FAILURES=${failures.length}`);
  for (const failure of failures) console.log(`FAIL=${failure}`);
  process.exit(1);
}

console.log('FAILURES=0');
console.log('PASS: Admin Backup / Restore has URL-backed backup selection and display-only health warnings.');
