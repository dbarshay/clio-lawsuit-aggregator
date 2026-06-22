const { spawn } = require("child_process");

const PORT = Number(process.env.PHASE43L_PORT || String(4300 + Math.floor(Math.random() * 500)));
const BASE_URL = `http://127.0.0.1:${PORT}`;
const READY_TIMEOUT_MS = Number(process.env.PHASE43L_READY_TIMEOUT_MS || 90000);

const representativePayload = {
  uploadTargetMode: "direct-matter",
  directMatterId: "1881278195",
  directMatterDisplayNumber: "BRL_202600001",
  useSingleMasterClioStorage: true,
  confirmUpload: false,
  singleMasterDryRun: true,
  singleMasterResolveFolders: true,
  allowDuplicateUploads: false,
  documentKeys: ["summons-complaint"],
  workingDocumentDriveItemId: "WORKING_DOCUMENT_DRIVE_ITEM_ID_REPRESENTATIVE",
  workingDocumentKey: "summons-complaint",
};

function redact(value) {
  if (!value || typeof value !== "object") return value;
  return JSON.parse(JSON.stringify(value, (key, val) => {
    if (/driveitemid|sourceDriveItemId|clioDocumentVersionUuid|versionUuid/i.test(key)) return "REDACTED";
    return val;
  }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const start = Date.now();
  while (Date.now() - start < READY_TIMEOUT_MS) {
    try {
      const res = await fetch(`${BASE_URL}/api/documents/direct-finalize-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directMatterId: representativePayload.directMatterId,
          directMatterDisplayNumber: representativePayload.directMatterDisplayNumber,
          directMatterFileNumber: representativePayload.directMatterDisplayNumber,
          matterDisplayNumber: representativePayload.directMatterDisplayNumber,
          uploadTargetMode: "direct-matter",
          useSingleMasterClioStorage: true,
          singleMasterDirectStorage: true,
          singleMasterDryRun: true,
          singleMasterResolveFolders: true,
          confirmUpload: false,
          documentKeys: representativePayload.documentKeys,
        }),
      });
      if (res.status < 500) return;
    } catch {
      // keep waiting
    }
    await sleep(1500);
  }
  throw new Error(`Local server did not become ready within ${READY_TIMEOUT_MS}ms`);
}

function assertNoUpload(json) {
  const uploaded = Array.isArray(json?.uploaded) ? json.uploaded : [];
  const noUploadPerformed =
    json?.noUploadPerformed === true ||
    json?.safety?.noUploadPerformed === true ||
    json?.safety?.noDocumentUploadPerformed === true ||
    json?.dryRun === true ||
    json?.singleMasterDryRun === true;

  if (uploaded.length > 0) {
    throw new Error(`Unexpected uploaded array length ${uploaded.length}`);
  }

  if (json?.databaseMutation === true || json?.safety?.databaseMutation === true) {
    throw new Error("Unexpected databaseMutation true");
  }

  if (json?.uploadPerformed === true || json?.safety?.uploadPerformed === true) {
    throw new Error("Unexpected uploadPerformed true");
  }

  if (json?.fullyUploaded === true) {
    throw new Error("Unexpected fullyUploaded true");
  }

  if (!noUploadPerformed) {
    throw new Error("Response did not positively prove noUploadPerformed/dryRun");
  }
}

async function main() {
  console.log("CONTRACT: Phase 43L route smoke is local/no-browser/no-upload.");
  console.log("PAYLOAD_PREVIEW_REDACTED=" + JSON.stringify(redact(representativePayload)));

  const child = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      CLIO_STORAGE_MODE: "single_master_matter",
      CLIO_MASTER_MATTER_ID: "1885821245",
      CLIO_MASTER_MATTER_NAME: "Barsh Matters Master Repository",
      CLIO_SINGLE_MASTER_ROOT_FOLDER_ID: "22053807035",
      CLIO_DOCUMENTS_ROOT_FOLDER_ID: "22053807035",
      CLIO_SINGLE_MASTER_STORAGE_MODE_ENABLED: "1",
      CLIO_SINGLE_MASTER_MODE_ENABLED: "1",
      CLIO_SINGLE_MASTER_ROOT_ENABLED: "1",
      CLIO_SINGLE_MASTER_DIRECT_INDIVIDUAL_ENABLED: "1",
      CLIO_SINGLE_MASTER_DIRECT_FINALIZE_ENABLED: "1",
      CLIO_DIRECT_INDIVIDUAL_FINALIZE_ENABLED: "1",
      CLIO_SINGLE_MASTER_STORAGE_ENABLED: "1",
      CLIO_SINGLE_MASTER_ENABLED: "1",
      CLIO_SINGLE_MASTER_DIRECT_STORAGE_ENABLED: "1",
      CLIO_SINGLE_MASTER_DRY_RUN_ENABLED: "1",
      CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED: "1",
      CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: "0",
      CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: "0",
      CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED: "1",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });

  let serverLog = "";
  child.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
    if (serverLog.length > 12000) serverLog = serverLog.slice(-12000);
  });
  child.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
    if (serverLog.length > 12000) serverLog = serverLog.slice(-12000);
  });

  try {
    await waitForServer();

    const response = await fetch(`${BASE_URL}/api/documents/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(representativePayload),
    });

    const json = await response.json().catch(() => null);
    console.log("FINALIZE_STATUS=" + response.status);
    console.log("FINALIZE_JSON_REDACTED=" + JSON.stringify(redact(json || {})));

    if (response.status >= 500) {
      throw new Error(`Finalize route returned server error ${response.status}`);
    }

    if (!json || typeof json !== "object") {
      throw new Error("Finalize route did not return JSON object");
    }

    assertNoUpload(json);

    console.log("PASS: local finalize route accepted/responded to direct UI dry-run payload without upload");
    console.log("RESULT: Phase 43L local route-level direct UI dry-run smoke");
  } finally {
    child.kill("SIGTERM");
    await sleep(1000);
    if (!child.killed) child.kill("SIGKILL");
  }
}

main().catch((error) => {
  console.error("FAIL:", error?.message || error);
  process.exit(1);
});
