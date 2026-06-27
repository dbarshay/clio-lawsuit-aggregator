import fs from "node:fs";

const source = fs.readFileSync("src/lib/admin-users/admin-users-classification-overrides-phase-w6.ts", "utf8");
const w5 = JSON.parse(fs.readFileSync("docs/admin-users/admin-users-phase-w5-classification-review.json", "utf8"));

const overrideBlocks = [...source.matchAll(/path: "([^"]+)"[\s\S]*?reviewedDisposition: "([^"]+)"/g)].map((match) => ({
  path: match[1],
  reviewedDisposition: match[2],
}));

const counts = {};
for (const row of overrideBlocks) counts[row.reviewedDisposition] = (counts[row.reviewedDisposition] || 0) + 1;

const payload = {
  phase: "admin-users-phase-w6-classification-overrides",
  basedOnPhaseW5: w5.phase,
  runtimeEnforcementChanged: false,
  uiHidingActive: false,
  backendRouteBlockingActive: false,
  databaseMutated: false,
  overridePlanOnly: true,
  overrideCount: overrideBlocks.length,
  byReviewedDisposition: counts,
  overrides: overrideBlocks,
};

fs.writeFileSync("docs/admin-users/admin-users-phase-w6-classification-overrides.json", JSON.stringify(payload, null, 2) + "\n");

const md = [
  "# Admin Users Phase W6 - Explicit Classification Override Plan",
  "",
  "Status: override plan only.",
  "",
  "No runtime enforcement is enabled.",
  "No UI hiding is enabled.",
  "No backend route blocking is enabled.",
  "No database changes are made.",
  "",
  `Based on W5 review: ${w5.phase}`,
  `W5 issue count: ${w5.issueCount}`,
  `Planned overrides: ${overrideBlocks.length}`,
  "",
  "## Override disposition counts",
  "",
  ...Object.entries(counts).sort().map(([key, value]) => `- ${key}: ${value}`),
  "",
  "## Planned override paths",
  "",
  ...overrideBlocks.map((row) => `- ${row.path} — ${row.reviewedDisposition}`),
  "",
  "## Next phase",
  "",
  "Phase W7 should apply these overrides to the W2 classification builder, rebuild W2/W3/W4 outputs, and verify that simulator output reflects reviewed classification. It should still not enforce blocks.",
  "",
].join("\n");

fs.writeFileSync("docs/admin-users/admin-users-phase-w6-classification-overrides.md", md);
console.log(JSON.stringify(payload, null, 2));
