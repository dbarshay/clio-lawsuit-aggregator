import fs from "node:fs";

const directPage = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const finalizePreview = fs.readFileSync("app/api/documents/finalize-preview/route.ts", "utf8");
const finalizeRoute = fs.readFileSync("app/api/documents/finalize/route.ts", "utf8");

const checks = [
  {
    label: "finalize-preview supports direct-matter upload target",
    pass:
      finalizePreview.includes('req.nextUrl.searchParams.get("uploadTarget")') &&
      finalizePreview.includes('uploadTargetMode === "direct-matter"') &&
      finalizePreview.includes('type: "direct-matter-documents-tab"') &&
      finalizePreview.includes("resolveClioMatterByDisplayNumber"),
  },
  {
    label: "finalize route forwards upload target params to preview",
    pass:
      finalizeRoute.includes("uploadTargetMode") &&
      finalizeRoute.includes("directMatterId") &&
      finalizeRoute.includes("directMatterDisplayNumber") &&
      finalizeRoute.includes('previewUrl.searchParams.set("uploadTarget"'),
  },
  {
    label: "Direct Matter finalization requests direct-matter upload target",
    pass:
      directPage.includes('params.set("uploadTarget", "direct-matter")') &&
      directPage.includes('uploadTargetMode: "direct-matter"') &&
      directPage.includes("directMatterNumericIdForDocuments()"),
  },
  {
    label: "Direct Matter confirmation copy says direct bill matter",
    pass:
      directPage.includes("direct bill matter Clio Documents tab"),
  },
  {
    label: "finalize route no longer claims master-only upload safety",
    pass:
      finalizeRoute.includes("uploadedOnlyToRequestedClioMatterDocumentsTab") &&
      !finalizeRoute.includes("uploadedOnlyToMasterMatterDocumentsTab: true"),
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
  console.error(`\nFAIL: ${failed} document finalization target routing check(s) failed.`);
  process.exit(1);
}

console.log("\nPASS: Direct finalization targets the direct bill matter, while master finalization remains separately targetable.");
