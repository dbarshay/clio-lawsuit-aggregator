import fs from 'node:fs';

const resolver = fs.readFileSync('src/lib/templates/template-builder-live-example-preview.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const failures = [];
const pass = (message) => console.log('\x1b[32mPASS\x1b[0m:', message);
const fail = (message) => { console.error('\x1b[31mFAIL\x1b[0m:', message); failures.push(message); };
if (resolver.includes('{{matter.billedAmount}}')) pass('Resolver maps matter.billedAmount'); else fail('Resolver maps matter.billedAmount');
if (resolver.includes('isLawsuitContext ? DASH')) pass('Resolver uses dash for child-only tokens in lawsuit context'); else fail('Resolver uses dash for child-only tokens in lawsuit context');
if (!resolver.includes('{{matter.dateOfService}}')) pass('Resolver excludes removed matter.dateOfService'); else fail('Resolver excludes removed matter.dateOfService');
if (!resolver.includes('{{claim.amount}}')) pass('Resolver excludes deleted claim.amount'); else fail('Resolver excludes deleted claim.amount');
if (pkg.scripts?.['verify:template-builder-live-preview-matter-tokens']) pass('Package has matter-token verifier script'); else fail('Package has matter-token verifier script');
if (failures.length > 0) { console.error('\n' + failures.length + ' matter-token checks failed.'); process.exit(1); }
console.log('\nPASS: Template Builder matter token verifier aligned with child/lawsuit semantics.');
