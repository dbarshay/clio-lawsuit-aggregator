#!/usr/bin/env node
const PROD = process.env.PRODUCTION_URL || "https://clio-lawsuit-aggregator.vercel.app";

const cases = [
  {
    name: "master-lawsuit-no-upload-dry-run",
    body: {
      masterLawsuitId: "2026.06.00015",
      uploadTargetMode: "master-lawsuit",
      useSingleMasterClioStorage: true,
      confirmUpload: false,
      singleMasterDryRun: true,
      singleMasterResolveFolders: false,
      documentKeys: ["summons-complaint"],
      workingDocumentDriveItemId: "",
      workingDocumentKey: "summons-complaint",
    },
  },
  {
    name: "direct-matter-no-upload-dry-run",
    body: {
      uploadTargetMode: "direct-matter",
      directMatterDisplayNumber: "BRL_202600003",
      useSingleMasterClioStorage: true,
      confirmUpload: false,
      singleMasterDryRun: true,
      singleMasterResolveFolders: false,
      documentKeys: ["summons-complaint"],
      workingDocumentDriveItemId: "",
      workingDocumentKey: "summons-complaint",
    },
  },
];

function pass(message) {
  console.log(`PASS: ${message}`);
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

async function main() {
  console.log("RESULT: production no-upload single-master finalize contract smoke starting");
  console.log("CONTRACT: confirmUpload=false, singleMasterDryRun=true, singleMasterResolveFolders=false; no upload, no folder resolution, no database mutation.");

  for (const test of cases) {
    console.log(`\n--- ${test.name} ---`);
    const res = await fetch(`${PROD}/api/documents/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(test.body),
    });
    const json = await res.json().catch(() => null);
    console.log(JSON.stringify({ status: res.status, body: json }, null, 2));

    const checks = [
      ["HTTP 200", res.status === 200],
      ["ok true", json?.ok === true],
      ["finalizeRewired true", json?.finalizeRewired === true],
      ["uploadRewired false", json?.uploadRewired === false],
      ["databaseMutation false", json?.databaseMutation === false],
      ["clioWrite false", json?.clioWrite === false],
      ["noUploadPerformed true", json?.noUploadPerformed === true],
      ["generationSkipped true", json?.generationSkipped === true],
      ["singleMasterDryRun true", json?.singleMasterDryRun === true],
      ["singleMasterResolveFolders false", json?.singleMasterResolveFolders === false],
      ["folderResolutionMode preview-only-no-clio-call", json?.folderResolutionMode === "preview-only-no-clio-call"],
      ["safety noDocumentUploadPerformed true", json?.safety?.noDocumentUploadPerformed === true],
      ["safety noDatabaseRecordsChanged true", json?.safety?.noDatabaseRecordsChanged === true],
    ];

    for (const [label, ok] of checks) {
      ok ? pass(`${test.name}: ${label}`) : fail(`${test.name}: ${label}`);
    }
  }

  if (process.exitCode) {
    console.error("RESULT: production no-upload single-master finalize contract smoke failed");
    process.exit(process.exitCode);
  }

  console.log("RESULT: production no-upload single-master finalize contract smoke passed");
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});
