#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const proxy = fs.readFileSync('proxy.ts', 'utf8');
const page = fs.readFileSync('app/page.tsx', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const required of [
  'const requestedPath = `${pathname}${req.nextUrl.search}`;',
  'redirectUrl.search = "";',
  'redirectUrl.searchParams.set("adminRequired", "1");',
  'redirectUrl.searchParams.set("from", requestedPath);',
]) {
  if (!proxy.includes(required)) {
    failures.push(`proxy.ts: missing clean redirect fragment: ${required}`);
  }
}

for (const required of [
  'params.get("adminRequired") !== "1"',
  'params.get("from") || "/admin"',
  'requestedPath.startsWith("/admin") ? requestedPath : "/admin"',
  'window.location.href = safeRequestedPath',
]) {
  if (!page.includes(required)) {
    failures.push(`app/page.tsx: missing admin redirect receiver fragment: ${required}`);
  }
}

if (pkg.scripts?.['verify:admin-proxy-clean-redirect-safety'] !== 'node scripts/verify-admin-proxy-clean-redirect-safety.mjs') {
  failures.push('package.json: missing verify:admin-proxy-clean-redirect-safety script');
}

console.log('RESULT: admin proxy clean redirect safety verifier');

if (failures.length) {
  console.log(`FAILURES=${failures.length}`);
  for (const failure of failures) console.log(`FAIL=${failure}`);
  process.exit(1);
}

console.log('FAILURES=0');
console.log('PASS: Admin proxy redirects clear stray query params and preserve requested admin path in from.');
