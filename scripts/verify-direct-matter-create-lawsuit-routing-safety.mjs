#!/usr/bin/env node

import fs from "node:fs";

const pagePath = "app/matter/[id]/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

function mustContain(label, haystack, needle) {
  if (!haystack.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function mustNotContain(label, haystack, needle) {
  if (haystack.includes(needle)) failures.push(`${label}: forbidden ${needle}`);
}

const functionStart = page.indexOf("async function submitAggregationWithOptions()");
const functionEnd = page.indexOf("function openLawsuitOptionsModal()", functionStart);

if (functionStart < 0) {
  failures.push("submitAggregationWithOptions function missing");
}

if (functionEnd < 0) {
  failures.push("openLawsuitOptionsModal boundary missing after submitAggregationWithOptions");
}

const submitBlock =
  functionStart >= 0 && functionEnd > functionStart
    ? page.slice(functionStart, functionEnd)
    : "";

mustContain(
  "direct create derives master lawsuit id",
  submitBlock,
  'const createdMasterLawsuitId = String(createJson.masterLawsuitId || "").trim();'
);
mustContain(
  "direct create routes to matters page",
  submitBlock,
  'const createdMasterLawsuitUrl = new URL("/matters", window.location.origin);'
);
mustContain(
  "direct create sets master URL filter",
  submitBlock,
  'createdMasterLawsuitUrl.searchParams.set("master", createdMasterLawsuitId);'
);
mustContain(
  "direct create records created master in URL state",
  submitBlock,
  'createdMasterLawsuitUrl.searchParams.set("createdMasterLawsuitId", createdMasterLawsuitId);'
);
mustContain(
  "direct create records origin in URL state",
  submitBlock,
  'createdMasterLawsuitUrl.searchParams.set("from", "create-lawsuit");'
);
mustContain(
  "direct create performs page routing",
  submitBlock,
  "window.location.assign(`${createdMasterLawsuitUrl.pathname}${createdMasterLawsuitUrl.search}`);"
);

mustNotContain(
  "direct create must not use blocking old success alert",
  submitBlock,
  "LOCAL LAWSUIT CREATED"
);
mustNotContain(
  "direct create must not reload current matter page after create",
  submitBlock,
  "window.location.reload();"
);

console.log("RESULT: verify Direct Matter Create Lawsuit routing safety");
console.log("PAGE=" + pagePath);
console.log("SCOPE=submitAggregationWithOptions");
console.log("EXPECTS_POST_CREATE_MATTERS_MASTER_ROUTE=YES");
console.log("EXPECTS_CREATED_MASTER_URL_STATE=YES");
console.log("EXPECTS_NO_BLOCKING_SUCCESS_ALERT=YES");
console.log("EXPECTS_NO_CURRENT_PAGE_RELOAD_IN_CREATE_FLOW=YES");
console.log("FAILURES=" + failures.length);

for (const failure of failures) console.log("FAIL=" + failure);

if (failures.length) process.exit(1);
