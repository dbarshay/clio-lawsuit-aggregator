#!/usr/bin/env node

import fs from "node:fs";

const pagePath = "app/matter/[id]/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const failures = [];

function mustContain(label, needle) {
  if (!page.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function mustNotContain(label, needle) {
  if (page.includes(needle)) failures.push(`${label}: forbidden ${needle}`);
}

mustContain("Start Lawsuit handler exists", "function openStartLawsuitModalFromMatter()");
mustContain("Start Lawsuit selects current matter", "setSelected([currentMatterId]);");
mustContain("Start Lawsuit opens popup", "setShowLawsuitOptionsModal(true);");
mustContain("Start Lawsuit button is wired", "onClick={openStartLawsuitModalFromMatter}");
mustContain("Start Lawsuit blocks aggregated matters", "disabled={submitting || matterIsClosedForPayment() || alreadyAggregated}");
mustContain("lower workspace directs user to Start Lawsuit", "Use the Start Lawsuit button in Matter Actions to create a lawsuit from this individual matter.");

mustNotContain("Start Lawsuit must not remain disabled placeholder", "title=\"Start Lawsuit action will be wired later.\"");
mustNotContain("lower individual matter creation button removed", "Select Matters to Generate");
mustNotContain("lower aggregate button removed from individual matter path", "Aggregate / Generate Lawsuit");
mustNotContain("stale lower lawsuit instruction removed", "Select one or more eligible matters, then generate the lawsuit.");
mustContain("lower lawsuit guidance points to Start Lawsuit", "Lawsuit creation for this individual matter starts from the Start Lawsuit button in Matter Actions.");
mustContain("lower unaggregated lawsuit workspace is not rendered", 'false && activeWorkspaceTab === "lawsuit" && !alreadyAggregated');

console.log("RESULT: verify Start Lawsuit button workflow safety");
console.log("PAGE=" + pagePath);
console.log("EXPECTS_START_LAWSUIT_BUTTON_WIRED=YES");
console.log("EXPECTS_START_LAWSUIT_SELECTS_CURRENT_MATTER=YES");
console.log("EXPECTS_LOWER_CREATION_ACTION_REMOVED=YES");
console.log("FAILURES=" + failures.length);

for (const failure of failures) console.log("FAIL=" + failure);

if (failures.length) process.exit(1);
