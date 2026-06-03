#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repo = process.cwd();
const plistPath = path.join(os.homedir(), 'Library/LaunchAgents/com.barshmatters.index-backup.plist');
const failures = [];

if (!fs.existsSync(plistPath)) {
  failures.push(`LaunchAgent plist missing: ${plistPath}`);
} else {
  let plistText = '';
  try {
    plistText = execFileSync('plutil', ['-p', plistPath], { encoding: 'utf8' });
  } catch {
    plistText = fs.readFileSync(plistPath, 'utf8');
  }

  for (const required of [
    'com.barshmatters.index-backup',
    '/bin/zsh',
    '/Users/dbarshay/clio-lawsuit-aggregator',
    'backup:indexes:monitored',
    'PG_DUMP_BIN',
    'PG_RESTORE_BIN',
    'BARSH_BACKUP_ALERT_TO',
    'dbarshay15@gmail.com',
    'dbarshay@brlfirm.com',
    'arizzo@brlfirm.com',
    'jlopez@brlfirm.com',
    'launchd.out.log',
    'launchd.err.log',
    '900',
  ]) {
    if (!plistText.includes(required)) {
      failures.push(`LaunchAgent plist missing required monitored-backup fragment: ${required}`);
    }
  }

  for (const banned of [
    'npm run backup:indexes"',
    'npm run backup:indexes\\n',
    'restore:indexes',
    'restore-local-indexes-sqlite-guarded',
    'restore-local-indexes-postgres-guarded',
    'rm -',
    'unlink',
    'clioFetch',
    '@/lib/clio',
    'CLIO_',
    'documents/clio',
    'documents/print-queue',
  ]) {
    if (plistText.includes(banned)) {
      failures.push(`LaunchAgent plist contains banned operational/destructive fragment: ${banned}`);
    }
  }
}

const monitoredScript = fs.existsSync('scripts/backup-local-indexes-monitored.mjs')
  ? fs.readFileSync('scripts/backup-local-indexes-monitored.mjs', 'utf8')
  : '';

if (!monitoredScript.includes('backup-failed') || !monitoredScript.includes('backup-stale')) {
  failures.push('Monitored backup script must include failure and stale alert handling.');
}

if (!monitoredScript.includes('toRecipients: alert.recipients.map')) {
  failures.push('Monitored backup script must support multiple Graph recipients.');
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:monitored-backup-launchagent-safety'] !== 'node scripts/verify-monitored-backup-launchagent-safety.mjs') {
  failures.push('package.json: missing verify:monitored-backup-launchagent-safety script');
}

console.log('RESULT: monitored backup LaunchAgent safety verifier');
console.log(`PLIST=${plistPath}`);

if (failures.length) {
  console.log(`FAILURES=${failures.length}`);
  for (const failure of failures) console.log(`FAIL=${failure}`);
  process.exit(1);
}

console.log('FAILURES=0');
console.log('PASS: LaunchAgent uses monitored backup with multi-recipient alerts and no restore/delete/Clio/document/print behavior.');
