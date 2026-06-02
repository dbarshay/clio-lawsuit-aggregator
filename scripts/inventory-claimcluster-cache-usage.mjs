#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = process.cwd();
const roots = [
  'app',
  'lib',
  'scripts',
  'prisma/schema.prisma',
].filter((rel) => fs.existsSync(path.join(repo, rel)));

const files = [];

const walk = (full) => {
  const stat = fs.statSync(full);

  if (stat.isDirectory()) {
    const base = path.basename(full);
    if (['node_modules', '.next', '.git', 'backups'].includes(base)) return;

    for (const entry of fs.readdirSync(full)) {
      walk(path.join(full, entry));
    }
    return;
  }

  if (/\.(ts|tsx|js|mjs|prisma)$/.test(full)) {
    files.push(full);
  }
};

for (const rel of roots) walk(path.join(repo, rel));

const sections = [
  ['ClaimClusterCache model/delegate', /\bClaimClusterCache\b|\bclaimClusterCache\b/g],
  ['claimClusterCache helper file', /claimClusterCache/g],
  ['refresh-cluster route', /refresh-cluster/g],
  ['cache reads', /\.findUnique\s*\(|\.findMany\s*\(|\.count\s*\(/g],
  ['cache writes', /\.upsert\s*\(|\.create\s*\(|\.update\s*\(|\.deleteMany\s*\(|\.delete\s*\(/g],
  ['critical local search routes mentioning cluster/cache', /search-grouped|local-generation-preview|local-generation-create|update-direct-field|identity-field/g],
];

const lines = [];
lines.push('RESULT: ClaimClusterCache usage inventory');
lines.push(`FILES_SCANNED=${files.length}`);
lines.push('');

for (const [label, re] of sections) {
  lines.push(`SECTION: ${label}`);

  let count = 0;

  for (const full of files) {
    const rel = path.relative(repo, full);
    const text = fs.readFileSync(full, 'utf8');
    const textLines = text.split(/\r?\n/);

    textLines.forEach((line, idx) => {
      re.lastIndex = 0;
      if (re.test(line)) {
        if (
          ['cache reads', 'cache writes'].includes(label) &&
          !/claimClusterCache|ClaimClusterCache|prisma\.claimClusterCache|refresh-cluster/.test(text)
        ) {
          return;
        }

        count += 1;
        lines.push(`${rel}:${idx + 1}: ${line.trim()}`);
      }
    });
  }

  lines.push(`COUNT=${count}`);
  lines.push('');
}

const outPath = '/tmp/barsh-claimcluster-cache-usage-inventory.txt';
fs.writeFileSync(outPath, lines.join('\n') + '\n');

console.log(lines.join('\n'));
console.log(`CLAIMCLUSTER_CACHE_USAGE_INVENTORY_FILE=${outPath}`);
