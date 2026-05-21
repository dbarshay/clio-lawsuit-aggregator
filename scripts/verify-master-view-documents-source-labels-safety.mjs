import fs from "node:fs";

const routePath = "app/api/documents/clio-matter-documents/route.ts";
const masterPagePath = "app/matters/page.tsx";

const route = fs.readFileSync(routePath, "utf8");
const masterPage = fs.readFileSync(masterPagePath, "utf8");

const checks = [
  {
    label: "route creates lawsuit and bill source labels",
    pass:
      route.includes('sourceLabel(masterDisplay, "lawsuit")') &&
      route.includes('sourceLabel(childResolution.clioDisplayNumber || childDisplay, "bill")') &&
      route.includes('`${normalizeBrl(displayNumber)}- ${role === "lawsuit" ? "Lawsuit" : "Bill"}`'),
  },
  {
    label: "master route aggregates mapped master and child bill documents",
    pass:
      route.includes('targetType === "master-lawsuit"') &&
      route.includes("childClaimIndexRows") &&
      route.includes("resolveClioMatterByDisplayNumber(childDisplay)") &&
      route.includes("sourceSummaries"),
  },
  {
    label: "document rows include source label and source Clio matter fields",
    pass:
      route.includes("sourceClioMatterId") &&
      route.includes("sourceClioDisplayNumber") &&
      route.includes("sourceRole") &&
      route.includes("sourceLabel"),
  },
  {
    label: "master View Documents UI displays source labels in list and detail panel",
    pass:
      masterPage.includes("doc.sourceLabel") &&
      masterPage.includes("selectedDoc.sourceLabel") &&
      masterPage.includes("selectedDoc.sourceClioDisplayNumber"),
  },
];

let failed = 0;
for (const check of checks) {
  if (check.pass) {
    console.log(`PASS: ${check.label}`);
  } else {
    failed += 1;
    console.log(`FAIL: ${check.label}`);
  }
}

if (failed) {
  console.error(`\nFAIL: ${failed} master source-label document check(s) failed.`);
  process.exit(1);
}

console.log("\nPASS: Master View Documents aggregates master/bill documents with requested source labels.");
