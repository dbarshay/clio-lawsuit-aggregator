const fs = require("fs");
const path = require("path");
let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
const helper = fs.readFileSync(path.join(process.cwd(), "lib/claimIndexQuery.ts"), "utf8");
const advanced = fs.readFileSync(path.join(process.cwd(), "app/api/advanced-search/candidates/route.ts"), "utf8");

if (helper.includes("buildBarshMatterDisplayNumberScopeWhere")) pass("shared BRL scope helper exists");
else fail("shared BRL scope helper missing");

if (helper.includes('startsWith: "BRL_"')) pass("shared scope accepts BRL_YYYYNNNNN");
else fail("shared scope does not accept BRL_YYYYNNNNN");

for (const token of ['"BRL3"', '"BRL4"', '"BRL5"', '"BRL6"', '"BRL7"', '"BRL8"', '"BRL9"']) {
  if (!helper.includes(token)) pass("shared scope excludes legacy " + token);
  else fail("shared scope still includes legacy " + token);
}

if (advanced.includes("buildBarshMatterDisplayNumberScopeWhere")) pass("advanced search uses shared BRL scope helper");
else fail("advanced search does not use shared BRL scope helper");

console.log("RESULT: BRL_YYYY-only search scope safety verifier");
if (failed) process.exit(1);
