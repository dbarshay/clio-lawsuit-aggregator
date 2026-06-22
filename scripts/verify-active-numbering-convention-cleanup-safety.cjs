const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const activeFiles = [
  "app/admin/claim-index/page.tsx",
  "app/admin/ticklers/page.tsx",
  "app/matters/page.tsx",
  "app/print-queue/page.tsx",
  "app/api/documents/clio-maildrop-resolve/route.ts",
  "app/page.tsx",
];

for (const file of activeFiles) {
  const text = read(file);
  if (!/placeholder="BRL30121"/.test(text)) pass(`${file} has no legacy BRL30121 placeholder`);
  else fail(`${file} still has legacy BRL30121 placeholder`);
  if (!/Uploading finalized PDF to Clio matter BRL30148/.test(text)) pass(`${file} has no legacy BRL30148 upload notice`);
  else fail(`${file} still has legacy BRL30148 upload notice`);
}

const adminClaim = read("app/admin/claim-index/page.tsx");
if (adminClaim.includes('placeholder="BRL_202600001"')) pass("Admin ClaimIndex placeholder uses BRL_YYYYNNNNN example");
else fail("Admin ClaimIndex placeholder not updated");

const ticklers = read("app/admin/ticklers/page.tsx");
if (ticklers.includes('placeholder="BRL_202600001"')) pass("Admin Ticklers placeholder uses BRL_YYYYNNNNN example");
else fail("Admin Ticklers placeholder not updated");

const home = read("app/page.tsx");
if (home.includes('placeholder="BRL_202600001 or 202600001"')) pass("Home Direct Entry shows full format and numeric shorthand");
else fail("Home Direct Entry placeholder not updated");
if (!home.includes("<span style={brlPrefixStyle}>BRL</span>")) pass("Home Direct Entry removed split BRL prefix");
else fail("Home Direct Entry still has split BRL prefix");

const matters = read("app/matters/page.tsx");
if (matters.includes("Barsh Matters Master Repository lawsuit storage")) pass("Matters upload notice uses storage repository wording");
else fail("Matters upload notice does not use repository wording");
if (!matters.includes('|| "BRL30148"')) pass("Matters page no longer falls back to BRL30148");
else fail("Matters page still falls back to BRL30148");

const printQueue = read("app/print-queue/page.tsx");
if (!printQueue.includes('BRL30148')) pass("Print queue no longer hard-codes BRL30148");
else fail("Print queue still hard-codes BRL30148");
if (printQueue.includes('^\\d{4}\\.\\d{2}\\.\\d{5}')) pass("Print queue recognizes lawsuit number format");
else fail("Print queue missing lawsuit number format recognition");

const helper = read("lib/claimIndexQuery.ts");
if (helper.includes('startsWith: "BRL_"')) pass("Search scope keeps BRL_YYYYNNNNN support");
else fail("Search scope missing BRL_YYYYNNNNN support");
for (const token of ['"BRL3"', '"BRL4"', '"BRL5"', '"BRL6"', '"BRL7"', '"BRL8"', '"BRL9"']) {
  if (!helper.includes(token)) pass(`Search scope excludes legacy compatibility ${token}`);
  else fail(`Search scope still includes legacy compatibility ${token}`);
}

console.log("RESULT: active numbering convention cleanup safety verifier");
if (failed) process.exit(1);
