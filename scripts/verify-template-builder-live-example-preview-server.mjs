import fs from 'node:fs';
import path from 'node:path';

const resolverPath = 'src/lib/templates/template-builder-live-example-preview.ts';
const packagePath = 'package.json';
const failures = [];

const pass = (message) => console.log('\x1b[32mPASS\x1b[0m:', message);
const fail = (message) => { console.error('\x1b[31mFAIL\x1b[0m:', message); failures.push(message); };
const read = (filePath) => fs.readFileSync(filePath, 'utf8');

const walk = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
};

const resolver = read(resolverPath);
const packageJson = JSON.parse(read(packagePath));
const routeCandidates = walk('app/api')
  .map((filePath) => ({ filePath, source: read(filePath) }))
  .filter(({ source }) => source.includes('resolveTemplateBuilderExamplePreview') || source.includes('example-preview'));
const routeCandidate = routeCandidates.find(({ source }) => source.includes('resolveTemplateBuilderExamplePreview'));

const has = (source, needle, message) => source.includes(needle) ? pass(message) : fail(message);
const lacks = (source, needle, message) => !source.includes(needle) ? pass(message) : fail(message);
const hasRegex = (source, pattern, message) => pattern.test(source) ? pass(message) : fail(message);

if (!routeCandidate) fail('API route calling resolveTemplateBuilderExamplePreview exists');
else pass('API route calling resolver exists at ' + routeCandidate.filePath);

has(resolver, 'resolveTemplateBuilderExamplePreview', 'Live resolver exports resolveTemplateBuilderExamplePreview');
has(resolver, 'tableColumns', 'Live resolver uses schema-aware tableColumns helper');
has(resolver, 'findRows(tableName: string, value: string, candidateColumns: string[]', 'Live resolver uses dynamic table row lookup');
hasRegex(resolver, /claimTables\s*=\s*tables\.filter\(\(table\)\s*=>\s*\/claimindex\|claim\|matter\/i\.test\(table\)\)/, 'Live resolver searches ClaimIndex/claim/matter tables');
hasRegex(resolver, /providerTables\s*=\s*tables\.filter\(\(table\)\s*=>\s*\/providerclientinfo\|provider\|client\/i\.test\(table\)\)/, 'Live resolver searches ProviderClientInfo/provider/client tables');
has(resolver, 'isLawsuitContext ? DASH', 'Live resolver uses dash for child-only tokens in lawsuit context');

for (const removed of [
  '{{patient.lastName}}',
  '{{provider.hidden_street}}',
  '{{provider.hidden_city}}',
  '{{provider.hidden_state}}',
  '{{provider.hidden_zipcode}}',
  '{{matter.dateOfService}}',
  '{{claim.dosStart}}',
  '{{claim.dosEnd}}',
  '{{treatingProvider.name}}',
  '{{claim.amount}}',
]) {
  lacks(resolver, removed, 'Live resolver excludes removed/deleted token ' + removed);
}

for (const kept of [
  '{{matter.billedAmount}}',
  '{{provider.taxId}}',
  '{{insurer.hidden_street}}',
  '{{insurer.hidden_city}}',
  '{{insurer.hidden_state}}',
  '{{insurer.hidden_zipcode}}',
  '{{claim.balance}}',
  '{{claim.payments}}',
  '{{lawsuit.indexNumber}}',
  '{{lawsuit.court}}',
  '{{lawsuit.adversaryAttorney}}',
  '{{lawsuit.dateFiled}}',
  '{{lawsuit.costs}}',
  '{{lawsuit.balance}}',
  '{{cost.indexFee}}',
  '{{cost.serviceFee}}',
  '{{cost.otherCourtCosts}}',
  '{{cost.total}}',
]) {
  has(resolver, kept, 'Live resolver maps kept token ' + kept);
}

has(resolver, 'providerTaxIdCandidateColumns', 'Live resolver reports provider tax ID candidate columns');
has(resolver, 'insurerHiddenResolved', 'Live resolver reports insurer hidden diagnostics');
has(resolver, 'lawsuitResolved', 'Live resolver reports lawsuit diagnostics');
has(resolver, 'costResolved', 'Live resolver reports cost diagnostics');

if (routeCandidate) {
  has(routeCandidate.source, 'resolveTemplateBuilderExamplePreview', 'API route calls resolver');
  has(routeCandidate.source, 'searchParams', 'API route reads matter search param');
}

if (!packageJson.scripts?.['verify:template-builder-live-example-preview-server']) fail('Package has server verifier script');
else pass('Package has server verifier script');

if (failures.length > 0) {
  console.error('\n' + failures.length + ' live example preview server checks failed.');
  process.exit(1);
}

console.log('\nPASS: Template Builder live example preview server wiring aligned with current child/lawsuit token semantics.');
