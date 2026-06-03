#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const pagePath = 'app/admin/backup-restore/page.tsx';
const statusRoutePath = 'app/api/admin/backups/status/route.ts';
const page = fs.readFileSync(pagePath, 'utf8');
const statusRoute = fs.readFileSync(statusRoutePath, 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const required of [
  'data-backup-manifest-detail-open="true"',
  'data-backup-manifest-detail-modal="read-only"',
  'aria-label="Read-only backup manifest detail"',
  'Backup Manifest Inspector',
  'Read-only manifest inspection.',
  'Restore execution and backup deletion are disabled in this inspector.',
  'Password stored in manifest',
  'URL stored in manifest',
  'Database Policy',
  'Document Policy',
  'Archive Counts',
  'Raw Manifest JSON',
  'data-raw-manifest-json="read-only"',
  'setDetailBackup(null)',
]) {
  if (!page.includes(required)) {
    failures.push(`${pagePath}: missing manifest detail UI fragment: ${required}`);
  }
}

for (const required of [
  'manifest,',
  'manifestJson: manifest ? JSON.stringify(manifest, null, 2) : ""',
]) {
  if (!statusRoute.includes(required)) {
    failures.push(`${statusRoutePath}: missing manifest detail status payload fragment: ${required}`);
  }
}

for (const banned of [
  'password:',
  'DATABASE_URL',
  'DIRECT_URL',
]) {
  if (page.includes(banned)) {
    failures.push(`${pagePath}: possible secret display marker found: ${banned}`);
  }
}

for (const [file, text] of [
  [pagePath, page],
  [statusRoutePath, statusRoute],
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

if (pkg.scripts?.['verify:admin-backup-manifest-detail-safety'] !== 'node scripts/verify-admin-backup-manifest-detail-safety.mjs') {
  failures.push('package.json: missing verify:admin-backup-manifest-detail-safety script');
}

console.log('RESULT: admin backup manifest detail safety verifier');

if (failures.length) {
  console.log(`FAILURES=${failures.length}`);
  for (const failure of failures) console.log(`FAIL=${failure}`);
  process.exit(1);
}

console.log('FAILURES=0');
console.log('PASS: Backup manifest detail inspector is read-only and avoids restore/delete/Clio/email/document/print behavior.');
