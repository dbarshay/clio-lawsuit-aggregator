import fs from 'node:fs';

const resolver = fs.readFileSync('src/lib/templates/template-builder-live-example-preview.ts', 'utf8');
const library = fs.readFileSync('src/lib/templates/template-builder-merge-field-library.ts', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const failures = [];
const pass = (message) => console.log('\x1b[32mPASS\x1b[0m:', message);
const fail = (message) => { console.error('\x1b[31mFAIL\x1b[0m:', message); failures.push(message); };
const has = (source, needle, message) => source.includes(needle) ? pass(message) : fail(message);
const lacks = (source, needle, message) => !source.includes(needle) ? pass(message) : fail(message);
for (const removed of ['{{treatingProvider.name}}', '{{claim.amount}}']) { lacks(library, removed, 'Library excludes deleted token ' + removed); lacks(resolver, removed, 'Resolver excludes deleted token ' + removed); }
has(resolver, 'const isLawsuitContext = /^\\d{4}\\.\\d{2}\\.\\d{5}$/.test(matterKey);', 'Resolver detects lawsuit context by lawsuit id');
has(resolver, '"{{matter.billedAmount}}": isLawsuitContext ? DASH', 'matter.billedAmount renders dash for lawsuit context');
has(resolver, '"{{claim.balance}}": isLawsuitContext ? DASH', 'claim.balance renders dash for lawsuit context');
has(resolver, '"{{claim.payments}}": isLawsuitContext ? DASH', 'claim.payments renders dash for lawsuit context');
has(resolver, 'billedAmount', 'matter.billedAmount can use child billed amount');
has(resolver, 'claimBalance', 'claim.balance can use child balance amount');
has(resolver, 'paymentTotal', 'claim.payments can use child payment amount');
for (const token of ['{{insurer.hidden_street}}', '{{insurer.hidden_city}}', '{{insurer.hidden_state}}', '{{insurer.hidden_zipcode}}']) has(resolver, token, 'Resolver maps insurer hidden source token ' + token);
for (const token of ['{{lawsuit.indexNumber}}', '{{lawsuit.court}}', '{{lawsuit.adversaryAttorney}}', '{{lawsuit.dateFiled}}', '{{lawsuit.costs}}', '{{lawsuit.balance}}']) has(resolver, token, 'Resolver maps lawsuit token ' + token);
for (const token of ['{{cost.indexFee}}', '{{cost.serviceFee}}', '{{cost.otherCourtCosts}}', '{{cost.total}}']) has(resolver, token, 'Resolver maps cost token ' + token);
has(resolver, 'providerTaxIdCandidateColumns', 'Resolver reports provider tax ID candidate columns');
if (!pkg.scripts?.['verify:template-builder-live-preview-child-lawsuit-token-sources']) fail('Package has child/lawsuit source verifier script'); else pass('Package has child/lawsuit source verifier script');
if (failures.length > 0) { console.error('\n' + failures.length + ' child/lawsuit token source checks failed.'); process.exit(1); }
console.log('\nPASS: Template Builder child/lawsuit token source semantics verified.');
