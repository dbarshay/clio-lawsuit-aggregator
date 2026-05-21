import fs from "node:fs";

const pagePath = "app/matter/[id]/page.tsx";
const page = fs.readFileSync(pagePath, "utf8");

const checks = [
  {
    label: "Direct Matter has usableMasterLawsuitIdForDocuments helper",
    pass:
      page.includes("function usableMasterLawsuitIdForDocuments") &&
      page.includes("packetPreview?.packet?.masterLawsuitId") &&
      page.includes("matter?.masterLawsuitId") &&
      page.includes("matter?.master_lawsuit_id") &&
      page.includes("tabMasterLawsuitId"),
  },
  {
    label: "helper rejects literal MASTER_LAWSUIT_ID placeholder",
    pass:
      page.includes('if (value === "MASTER_LAWSUIT_ID") continue') &&
      page.includes("/^\\\\d{4}\\\\.\\\\d{2}\\\\.\\\\d{5}$/.test(value)"),
  },
  {
    label: "loadFinalizePreview uses helper",
    pass:
      /async function loadFinalizePreview\(\)[\s\S]{0,600}const masterLawsuitId = usableMasterLawsuitIdForDocuments\(\)/.test(page),
  },
  {
    label: "uploadFinalDocumentsToClio uses helper",
    pass:
      /async function uploadFinalDocumentsToClio\(\)[\s\S]{0,800}const masterLawsuitId = usableMasterLawsuitIdForDocuments\(\)/.test(page),
  },
  {
    label: "finalize path no longer sends placeholder directly from packet/matter only",
    pass:
      !page.includes("const masterLawsuitId =\\n      textValue(packetPreview?.packet?.masterLawsuitId) ||\\n      textValue(matter?.masterLawsuitId);"),
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
  console.error(`\nFAIL: ${failed} Direct Matter finalization master ID safety check(s) failed.`);
  process.exit(1);
}

console.log("\nPASS: Direct Matter finalization resolves a real Master Lawsuit ID and rejects the placeholder.");
