#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repo = process.cwd();
const failures = [];

const requiredFiles = [
  'CLAIMCLUSTER_CACHE_CONTRACT.txt',
  'CLAIMINDEX_LOCAL_SOURCE_CONTRACT.txt',
  'CLAIMINDEX_CLEANUP_PLAN.txt',
];

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(repo, rel))) {
    failures.push(`missing required contract/plan file: ${rel}`);
  }
}

const contract = fs.existsSync('CLAIMCLUSTER_CACHE_CONTRACT.txt')
  ? fs.readFileSync('CLAIMCLUSTER_CACHE_CONTRACT.txt', 'utf8')
  : '';

for (const phrase of [
  'ClaimClusterCache is a local performance/cache helper only',
  'ClaimClusterCache is not a source of truth',
  'Search results must not depend on ClaimClusterCache as the correctness source',
  'Lawsuit generation must not use ClaimClusterCache as the source for sibling membership',
  'Direct matter display/edit routes must not use ClaimClusterCache',
  'ClaimClusterCache must not import or call Clio helpers',
  'ClaimClusterCache must not contain Clio custom-field logic',
  'app/api/claim-index/refresh-cluster is a quarantined legacy operational route',
]) {
  if (!contract.includes(phrase)) {
    failures.push(`CLAIMCLUSTER_CACHE_CONTRACT.txt missing phrase: ${phrase}`);
  }
}

const cacheHelperPath = 'lib/claimClusterCache.ts';
if (fs.existsSync(cacheHelperPath)) {
  const text = fs.readFileSync(cacheHelperPath, 'utf8');

  if (!text.includes('ClaimClusterCache is a local performance cache only')) {
    failures.push(`${cacheHelperPath}: missing cache-only header`);
  }

  if (/clioFetch|fetchMatterFromClio|getMatterFromClio|ingestMatterFromClio|ingestMattersFromClioBatch|custom_field_values|customFieldValues|\/api\/clio\/matter-context|matter-context/u.test(text)) {
    failures.push(`${cacheHelperPath}: must not contain Clio operational/hydration/custom-field logic`);
  }
}

const blockedRefreshClusterPath = 'app/api/claim-index/refresh-cluster/route.ts';
if (fs.existsSync(blockedRefreshClusterPath)) {
  const text = fs.readFileSync(blockedRefreshClusterPath, 'utf8');

  if (!text.includes('legacyClioOperationalRouteBlocked')) {
    failures.push(`${blockedRefreshClusterPath}: refresh-cluster must remain blocked unless replaced by explicit local-only cache maintenance`);
  }

  if (/clioFetch|fetchMatterFromClio|getMatterFromClio|ingestMatterFromClio|ingestMattersFromClioBatch|custom_field_values|customFieldValues/u.test(text)) {
    failures.push(`${blockedRefreshClusterPath}: blocked route must not contain active Clio operational code`);
  }
}

const forbiddenCriticalPaths = [
  'app/api/claim-index/search-grouped/route.ts',
  'app/api/lawsuits/local-generation-preview/route.ts',
  'app/api/lawsuits/local-generation-create/route.ts',
  'app/api/matters/update-direct-field/route.ts',
  'app/api/matters/identity-field/route.ts',
  'app/matter/[id]/page.tsx',
  'app/matters/page.tsx',
];

for (const rel of forbiddenCriticalPaths) {
  if (!fs.existsSync(rel)) continue;

  const text = fs.readFileSync(rel, 'utf8');
  const lines = text.split(/\r?\n/);

  lines.forEach((line, idx) => {
    if (/claimClusterCache|ClaimClusterCache|from\s+['"][^'"]*claimClusterCache[^'"]*['"]|refresh-cluster/u.test(line)) {
      failures.push(`${rel}:${idx + 1}: critical path must not depend on ClaimClusterCache: ${line.trim()}`);
    }
  });
}

const schema = fs.existsSync('prisma/schema.prisma')
  ? fs.readFileSync('prisma/schema.prisma', 'utf8')
  : '';

if (!schema.includes('model ClaimClusterCache')) {
  failures.push('schema model missing unexpectedly in non-destructive pass: ClaimClusterCache');
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (!pkg.scripts?.['verify:claimcluster-cache-contract']) {
  failures.push('package.json missing verify:claimcluster-cache-contract');
}

console.log('RESULT: verify ClaimClusterCache contract');
console.log('CLAIM_CLUSTER_CACHE_SOURCE_OF_TRUTH=NO');
console.log('CRITICAL_PATH_DEPENDENCY_ALLOWED=NO');
console.log(`FAILURES=${failures.length}`);
for (const failure of failures) console.log(`FAIL=${failure}`);

if (failures.length) process.exit(1);
