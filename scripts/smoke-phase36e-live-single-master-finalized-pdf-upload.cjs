const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");

const PORT = Number(process.env.PHASE36E_PORT || 3324);
const BASE = `http://127.0.0.1:${PORT}`;
const MASTER_LAWSUIT_ID = process.env.PHASE36E_MASTER_LAWSUIT_ID || "2026.05.00001";
const REQUESTED_KEY = process.env.PHASE36E_DOCUMENT_KEY || "";
const WORKING_DOC_ID = process.env.PHASE36E_WORKING_DOCUMENT_DRIVE_ITEM_ID || process.env.WORKING_DOCUMENT_DRIVE_ITEM_ID || "";

function redact(value) {
  return String(value || "")
    .replace(/(client_secret=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(refresh_token=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(access_token=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(Authorization:\s*Bearer\s+)[^\s"]+/gi, "$1***REDACTED***")
    .replace(/(CLIO_CLIENT_SECRET=).+/gi, "$1***REDACTED***")
    .replace(/(CLIO_REFRESH_TOKEN=).+/gi, "$1***REDACTED***")
    .replace(/(DATABASE_URL=).+/gi, "$1***REDACTED***")
    .replace(/(PHASE36E_WORKING_DOCUMENT_DRIVE_ITEM_ID=).+/gi, "$1***REDACTED***")
    .replace(/(WORKING_DOCUMENT_DRIVE_ITEM_ID=).+/gi, "$1***REDACTED***");
}

function parseDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const eq = line.indexOf("=");
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!key) continue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

function mergeNonEmptyEnvFiles(filePaths) {
  const out = {};
  for (const filePath of filePaths) {
    const parsed = parseDotEnvFile(filePath);
    for (const [key, value] of Object.entries(parsed)) {
      if (String(value || "").trim()) out[key] = value;
    }
  }
  return out;
}

function loadLocalEnvWithoutPrintingSecrets() {
  return {
    ...mergeNonEmptyEnvFiles([".env", ".env.local", ".env.development", ".env.development.local", ".env.production", ".env.production.local", ".env.vercel.production"]),
    ...process.env,
  };
}

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request(`${BASE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    }, (res) => {
      let chunks = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { chunks += chunk; });
      res.on("end", () => {
        let json = null;
        try { json = chunks ? JSON.parse(chunks) : null; } catch {}
        resolve({ status: res.statusCode, body: chunks, json });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

(async () => {
  console.log("RESULT: Phase 36E live single-master finalized PDF upload smoke starting");
  console.log("CONTRACT: this is the first intentional finalized PDF upload to the resolved single-master Clio folder. It requires PHASE36E_WORKING_DOCUMENT_DRIVE_ITEM_ID.");

  if (!String(WORKING_DOC_ID || "").trim()) {
    console.log("BLOCKED: PHASE36E_WORKING_DOCUMENT_DRIVE_ITEM_ID is missing.");
    console.log("NEXT: In the app, open Generate Documents → Edit Document for one document, save the Word document, then rerun with PHASE36E_WORKING_DOCUMENT_DRIVE_ITEM_ID=<drive item id>.");
    process.exit(2);
  }

  const localEnv = loadLocalEnvWithoutPrintingSecrets();
  for (const key of ["CLIO_CLIENT_ID", "CLIO_CLIENT_SECRET", "CLIO_REFRESH_TOKEN"]) {
    assert(String(localEnv[key] || "").trim().length > 0, key + " present without printing value");
  }

  let serverLog = "";
  const child = spawn("npm", ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...localEnv,
      CLIO_STORAGE_MODE: "single_master_matter",
      CLIO_MASTER_MATTER_ID: localEnv.CLIO_MASTER_MATTER_ID || "1885821245",
      CLIO_MASTER_MATTER_NAME: localEnv.CLIO_MASTER_MATTER_NAME || "Barsh Matters Master Repository",
      CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED: "1",
      CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: "1",
      CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: "1",
      CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND: "RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE",
      CLIO_SINGLE_MASTER_ROOT_FOLDER_ID: localEnv.CLIO_SINGLE_MASTER_ROOT_FOLDER_ID || localEnv.CLIO_DOCUMENTS_ROOT_FOLDER_ID || "22053807035",
      PHASE_36E_SMOKE: "1"
    }
  });

  child.stdout.on("data", (chunk) => { serverLog += chunk.toString(); });
  child.stderr.on("data", (chunk) => { serverLog += chunk.toString(); });

  try {
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        const res = await request("GET", "/", null);
        if (res.status && res.status < 500) { ready = true; break; }
      } catch {}
      await wait(1000);
    }
    assert(ready, "local dev server became reachable");

    const preview = await request("GET", `/api/documents/finalize-preview?masterLawsuitId=${encodeURIComponent(MASTER_LAWSUIT_ID)}`, null);
    console.log("PREVIEW_STATUS=" + preview.status);
    assert(preview.status === 200 && preview.json, "finalize preview loaded");
    const planned = Array.isArray(preview.json.plannedDocuments) ? preview.json.plannedDocuments : [];
    const doc = REQUESTED_KEY
      ? planned.find((d) => d && d.key === REQUESTED_KEY)
      : planned.find((d) => d && d.wouldGenerate && d.wouldUploadToClio && d.key);
    assert(Boolean(doc), "selected uploadable planned document");
    assert(doc.wouldGenerate === true && doc.wouldUploadToClio === true, "selected document is uploadable");
    console.log("SELECTED_DOCUMENT_KEY=" + doc.key);
    console.log("SELECTED_DOCUMENT_FILENAME=" + doc.filename);

    const body = {
      masterLawsuitId: MASTER_LAWSUIT_ID,
      confirmUpload: true,
      useSingleMasterClioStorage: true,
      singleMasterDryRun: false,
      singleMasterResolveFolders: true,
      allowDuplicateUploads: true,
      documentKeys: [doc.key],
      workingDocumentDriveItemId: WORKING_DOC_ID,
      workingDocumentKey: doc.key
    };

    const res = await request("POST", "/api/documents/finalize", body);
    console.log("HTTP_STATUS=" + res.status);
    console.log("RESPONSE_JSON=" + JSON.stringify(res.json, null, 2));

    if (res.status !== 200 || !res.json || res.json.ok !== true) {
      console.log("RESPONSE_BODY_REDACTED_START");
      console.log(redact(res.body).slice(0, 12000));
      console.log("RESPONSE_BODY_REDACTED_END");
      console.log("SERVER_LOG_REDACTED_START");
      console.log(redact(serverLog).slice(-20000));
      console.log("SERVER_LOG_REDACTED_END");
      throw new Error("Phase 36E expected HTTP 200 ok true live upload response");
    }

    assert(res.json.uploadRewired === true, "uploadRewired true");
    assert(res.json.folderResolution && Number(res.json.folderResolution.folderId) > 0, "folderResolution final folder id returned");
    assert(Array.isArray(res.json.uploaded) && res.json.uploaded.length === 1, "exactly one document uploaded");
    const uploaded = res.json.uploaded[0];
    assert(uploaded.clioUploadParent?.type === "Folder", "uploaded parent type is Folder");
    assert(Number(uploaded.clioUploadParent?.id) === Number(res.json.folderResolution.folderId), "uploaded parent id matches resolved folder id");
    assert(Number(uploaded.clioDocumentId) > 0, "Clio document id returned");
    assert(uploaded.fullyUploaded === true, "Clio fullyUploaded true");
    assert(res.json.finalizationRecord && res.json.finalizationRecord.ok === true, "database audit record created");
    assert(res.json.safety?.uploadedToResolvedSingleMasterFolder === true, "safety confirms resolved single-master folder upload");
    console.log("FINAL_FOLDER_ID=" + res.json.folderResolution.folderId);
    console.log("CLIO_DOCUMENT_ID=" + uploaded.clioDocumentId);
    console.log("RESULT: Phase 36E live single-master finalized PDF upload smoke passed");
  } finally {
    child.kill("SIGTERM");
    await wait(500);
    if (!child.killed) child.kill("SIGKILL");
  }
})().catch((err) => {
  const code = err && err.message && err.message.includes("PHASE36E_WORKING_DOCUMENT_DRIVE_ITEM_ID") ? 2 : 1;
  console.error("FAIL:", err && err.stack ? redact(err.stack) : redact(err));
  process.exit(code);
});
