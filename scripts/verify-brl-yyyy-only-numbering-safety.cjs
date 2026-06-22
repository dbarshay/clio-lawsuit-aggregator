const fs = require("fs");
const path = require("path");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const helper = read("lib/claimIndexQuery.ts");
const byPrefix = read("app/api/claim-index/by-display-prefix/route.ts");
const byMatter = read("app/api/claim-index/by-matter/route.ts");
const home = read("app/page.tsx");
const maildrop = read("app/api/documents/clio-maildrop-resolve/route.ts");

if (helper.includes('startsWith: "BRL_"')) pass("ClaimIndex scope accepts BRL_YYYYNNNNN");
else fail("ClaimIndex scope missing BRL_YYYYNNNNN scope");

for (const token of ['"BRL3"', '"BRL4"', '"BRL5"', '"BRL6"', '"BRL7"', '"BRL8"', '"BRL9"']) {
  if (!helper.includes(token)) pass(`ClaimIndex scope removed legacy ${token}`);
  else fail(`ClaimIndex scope still contains legacy ${token}`);
}

if (home.includes('placeholder="BRL_202600001 or 202600001"')) pass("Home Direct Entry shows full format plus numeric shorthand");
else fail("Home Direct Entry placeholder not updated");

if (home.includes("if (digits.length === 9) return `BRL_${digits}`;")) pass("Home Direct Entry normalizes 9-digit numeric shorthand");
else fail("Home Direct Entry missing 9-digit shorthand normalization");

if (!home.includes("if (digits.length >= 5) return `BRL${digits}`;")) pass("Home Direct Entry removed legacy 5-digit shorthand");
else fail("Home Direct Entry still supports legacy 5-digit shorthand");

if (!home.includes("<span style={brlPrefixStyle}>BRL</span>")) pass("Home Direct Entry removed split BRL prefix");
else fail("Home Direct Entry still has split BRL prefix");

if (byPrefix.includes("if (digits.length === 9) return `BRL_${digits}`;")) pass("by-display-prefix normalizes 9-digit shorthand");
else fail("by-display-prefix missing 9-digit shorthand normalization");

if (byPrefix.includes("isBrlNewConvention")) pass("by-display-prefix filters to BRL_YYYYNNNNN");
else fail("by-display-prefix missing new-convention filter");

if (!byPrefix.includes("isBrl30000Plus")) pass("by-display-prefix removed legacy BRL30000+ filter");
else fail("by-display-prefix still has legacy BRL30000+ filter");

if (byMatter.includes("if (digits.length === 9) return `BRL_${digits}`;")) pass("by-matter normalizes 9-digit shorthand");
else fail("by-matter missing 9-digit shorthand normalization");

if (!byMatter.includes("? `BRL${displayNumber}`")) pass("by-matter removed legacy BRL + digits normalization");
else fail("by-matter still has legacy BRL + digits normalization");

if (!maildrop.includes("legacy BRL30121")) pass("maildrop comment removed legacy example");
else fail("maildrop comment still mentions legacy BRL30121");

console.log("RESULT: BRL_YYYYNNNNN-only numbering safety verifier");
if (failed) process.exit(1);
