import fs from "node:fs";

const path = "app/api/documents/packet/route.ts";
const route = fs.readFileSync(path, "utf8");

const checks = [
  {
    label: "packet route selects Clio master mapping fields from Lawsuit",
    pass:
      route.includes("clioMasterMatterId: true") &&
      route.includes("clioMasterDisplayNumber: true") &&
      route.includes("clioMasterMatterDescription: true") &&
      route.includes("clioMasterMappingSource: true"),
  },
  {
    label: "packet route uses Lawsuit Clio mapping for masterMatter",
    pass:
      route.includes("matterId: lawsuit.clioMasterMatterId") &&
      route.includes("displayNumber: lawsuit.clioMasterDisplayNumber") &&
      route.includes('source: "lawsuit.clio-master-mapping"'),
  },
  {
    label: "packet route preserves fallback to ClaimIndex master row",
    pass:
      route.includes(": master") &&
      route.includes("...(master || {})"),
  },
  {
    label: "packet route exposes Clio mapping on returned lawsuit object",
    pass:
      route.includes("clioMasterMatterId: lawsuit.clioMasterMatterId") &&
      route.includes("clioMasterDisplayNumber: lawsuit.clioMasterDisplayNumber"),
  },
  {
    label: "packet route allows generation with mapped Clio master matter even without ClaimIndex master row",
    pass:
      route.includes("const hasMappedClioMasterMatter") &&
      route.includes("masterRows.length === 0 && !hasMappedClioMasterMatter") &&
      route.includes("hasMappedClioMasterMatter,") &&
      route.includes("hasClaimIndexMasterMatter: masterRows.length > 0"),
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
  console.error(`\nFAIL: ${failed} packet Clio master mapping safety check(s) failed.`);
  process.exit(1);
}

console.log("\nPASS: packet route returns mapped Clio master matter and allows document generation from that mapping.");
