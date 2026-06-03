#!/usr/bin/env node

import fs from "node:fs";

const pagePath = "app/lawsuits/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

function mustContain(label, needle) {
  if (!page.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function mustNotContain(label, needle) {
  if (page.includes(needle)) failures.push(`${label}: forbidden ${needle}`);
}

mustContain("success notice state exists", "createSuccessNotice");
mustContain("success notice exact visible text exists", "Lawsuit Created");
mustContain("success notice link targets master lawsuit aggregation page", "`/matters?master=${encodeURIComponent(createdMasterLawsuitId)}`");
mustContain("success notice clears after two seconds", "}, 2000);");
mustContain("success notice clears on click", "onClick={() => setCreateSuccessNotice(null)}");
mustContain("success notice displays clickable master lawsuit id", "{createSuccessNotice.masterLawsuitId}");
mustContain("success notice is styled as a fixed page-level notice", "const lawsuitCreatedNotice: React.CSSProperties");
mustContain("create popup clears stale success notice", "setCreateSuccessNotice(null);");
mustContain("create response derives master lawsuit id", "const createdMasterLawsuitId = String(");
mustContain("post-create refresh uses URL state", "const urlSearchState = lawsuitsSearchStateFromUrl();");
mustContain("post-create refresh preserves current URL/history entry", "{ replaceUrl: true }");
mustContain("post-create refresh falls back to current search fields", ": { claim, patient, provider, insurer }");

mustNotContain("create success must not use blocking alert", "LOCAL LAWSUIT CREATED");
mustNotContain("create success must not push bad URL history entry after create", "await search();");

console.log("RESULT: verify Create Lawsuit success notice and history safety");
console.log("FILE=" + pagePath);
console.log("EXPECTS_CLICKABLE_SUCCESS_NOTICE=YES");
console.log("EXPECTS_AUTO_CLEAR_2_SECONDS=YES");
console.log("EXPECTS_HISTORY_SAFE_REFRESH=YES");
console.log("EXPECTS_NO_BLOCKING_ALERT=YES");
console.log("FAILURES=" + failures.length);

for (const failure of failures) console.log("FAIL=" + failure);

if (failures.length) process.exit(1);
