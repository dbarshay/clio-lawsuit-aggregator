import fs from 'node:fs';

const resolver = fs.readFileSync('src/lib/templates/template-builder-live-example-preview.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const failures = [];
const pass = (message) => console.log('\x1b[32mPASS\x1b[0m:', message);
const fail = (message) => { console.error('\x1b[31mFAIL\x1b[0m:', message); failures.push(message); };
const has = (needle, message) => resolver.includes(needle) ? pass(message) : fail(message);

for (const token of ['{{matter.fileNumber}}', '{{matter.providerName}}', '{{matter.patientName}}', '{{matter.claimNumber}}']) {
  has(token, 'Resolver returns core matter token ' + token);
}
has('"{{matter.fileNumber}}": "2026.06.00011"', 'Preview fallback differentiates matter file number for 2026.06.00011');
has('"{{matter.fileNumber}}": "2026.06.00012"', 'Preview fallback differentiates matter file number for 2026.06.00012');
has('"{{matter.providerName}}": "Preview Provider 11"', 'Preview fallback differentiates provider for 2026.06.00011');
has('"{{matter.providerName}}": "Preview Provider 12"', 'Preview fallback differentiates provider for 2026.06.00012');
has('"{{matter.claimNumber}}": "PREVIEW-CLAIM-11"', 'Preview fallback differentiates claim number for 2026.06.00011');
has('"{{matter.claimNumber}}": "PREVIEW-CLAIM-12"', 'Preview fallback differentiates claim number for 2026.06.00012');
has('matterKey', 'Resolver can fall back to selected matter key instead of old static example');
if (!pkg.scripts?.['verify:template-builder-preview-core-matter-tokens']) fail('Package has core matter token verifier script');
else pass('Package has core matter token verifier script');
if (failures.length > 0) { console.error('\n' + failures.length + ' preview core matter token checks failed.'); process.exit(1); }
console.log('\nPASS: Template Builder preview resolver returns selected core matter tokens.');
