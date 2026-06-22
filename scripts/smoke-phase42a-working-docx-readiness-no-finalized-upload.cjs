const { spawn } = require("child_process");
const net = require("net");

let failed = false;
const pass = (m) => console.log("PASS: " + m);
const fail = (m) => { failed = true; console.error("FAIL: " + m); };
function assert(ok, msg) { ok ? pass(msg) : fail(msg); }
const DIRECT_MATTER_ID = "1881278195";
const DIRECT_FILE_NUMBER = "BRL_202600001";
const DOCUMENT_KEY = "harmless-stored-docx-test-template";
function redact(value) {
  return String(value || "")
    .replace(/("driveItemId"\s*:\s*")[^"]+/gi, "$1***REDACTED***")
    .replace(/("id"\s*:\s*")[A-Za-z0-9!._-]{20,}/gi, "$1***REDACTED***")
    .replace(/(access_token=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(refresh_token=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(client_secret=)[^&\s"]+/gi, "$1***REDACTED***");
}
function getFreePort() { return new Promise((resolve, reject) => { const server = net.createServer(); server.listen(0, "127.0.0.1", () => { const a = server.address(); const p = a && typeof a === "object" ? a.port : 0; server.close(() => resolve(p)); }); server.on("error", reject); }); }
async function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function waitForServer(baseUrl, proc, output) {
  const deadline = Date.now() + 60000;
  let lastError = "";
  while (Date.now() < deadline) {
    try { const res = await fetch(baseUrl + "/api/documents/direct-finalize-preview?directMatterId=" + encodeURIComponent(DIRECT_MATTER_ID) + "&directMatterDisplayNumber=" + encodeURIComponent(DIRECT_FILE_NUMBER) + "&singleMasterDirectStorage=1", { method: "GET", cache: "no-store" }); if (res.status >= 200) return; } catch (err) { lastError = err && err.message ? err.message : String(err); }
    if (proc.exitCode != null) throw new Error(`local Next server exited early with code ${proc.exitCode}. Output:\n${output.join("")}`);
    await sleep(750);
  }
  throw new Error(`Timed out waiting for local Next server. Last error: ${lastError}. Output:\n${output.join("")}`);
}
function startServer() {
  return new Promise(async (resolve, reject) => {
    const port = await getFreePort();
    const output = [];
    const env = { ...process.env, PORT: String(port), NO_COLOR: "1", NEXT_TELEMETRY_DISABLED: "1", CLIO_STORAGE_MODE: "single_master_matter", CLIO_MASTER_MATTER_ID: "1885821245", CLIO_MASTER_MATTER_NAME: "Barsh Matters Master Repository", CLIO_SINGLE_MASTER_ROOT_FOLDER_ID: "22053807035", CLIO_DOCUMENTS_ROOT_FOLDER_ID: "22053807035", CLIO_DIRECT_INDIVIDUAL_FINALIZE_TARGET_INPUT_ENABLED: "1", CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED: "0", CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: "0", CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: "0" };
    const proc = spawn("npm", ["run", "dev", "--", "-p", String(port), "-H", "127.0.0.1"], { env, stdio: ["ignore", "pipe", "pipe"], detached: true });
    proc.stdout.on("data", (d) => output.push(String(d)));
    proc.stderr.on("data", (d) => output.push(String(d)));
    proc.on("error", reject);
    const baseUrl = `http://127.0.0.1:${port}`;
    try { await waitForServer(baseUrl, proc, output); resolve({ proc, baseUrl, output }); } catch (err) { stopServer(proc); reject(err); }
  });
}
function stopServer(proc) { if (!proc || proc.killed) return; try { process.kill(-proc.pid, "SIGTERM"); } catch {} try { proc.kill("SIGTERM"); } catch {} }
async function request(baseUrl, method, path, body) {
  const res = await fetch(baseUrl + path, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { status: res.status, text, json };
}
function workingPayloads(doc, preview) {
  return [
    { confirmCreate: true, matterId: DIRECT_MATTER_ID, directMatterId: DIRECT_MATTER_ID, uploadTargetMode: "direct-matter", directMatterDisplayNumber: DIRECT_FILE_NUMBER, useSingleMasterClioStorage: true, singleMasterDirectStorage: true, documentKey: doc.key, documentKeys: [doc.key] },
    { confirmCreate: true, matterId: DIRECT_MATTER_ID, uploadTargetMode: "direct-matter", directMatterDisplayNumber: DIRECT_FILE_NUMBER, useSingleMasterClioStorage: true, singleMasterDirectStorage: true, documentKey: doc.key, documentKeys: [doc.key] },
    { confirmCreate: true, directMatterId: DIRECT_MATTER_ID, uploadTargetMode: "direct-matter", directMatterDisplayNumber: DIRECT_FILE_NUMBER, useSingleMasterClioStorage: true, singleMasterDirectStorage: true, documentKey: doc.key, documentKeys: [doc.key] },
  ];
}
(async () => {
  console.log("RESULT: Phase 42A working-DOCX readiness no finalized upload smoke starting");
  const server = await startServer();
  try {
    const preview = await request(server.baseUrl, "GET", `/api/documents/direct-finalize-preview?directMatterId=${encodeURIComponent(DIRECT_MATTER_ID)}&directMatterDisplayNumber=${encodeURIComponent(DIRECT_FILE_NUMBER)}&singleMasterDirectStorage=1`);
    assert(preview.status === 200, `direct finalize preview loads (actual ${preview.status})`);
    assert(preview.json?.ok === true, "direct finalize preview ok true");
    assert(preview.json?.directMatterDisplayNumber === DIRECT_FILE_NUMBER || preview.json?.clioUploadTarget?.directMatterFileNumber === DIRECT_FILE_NUMBER, "preview preserves BRL direct storage target");
    const docs = Array.isArray(preview.json?.plannedDocuments) ? preview.json.plannedDocuments : [];
    const doc = docs.find((item) => item.key === DOCUMENT_KEY) || docs.find((item) => item.availableNow && item.hasStoredDocx) || docs[0];
    assert(Boolean(doc?.key), "selected a planned direct DOCX document");
    console.log("SELECTED_DOCUMENT_KEY=" + doc.key);
    console.log("SELECTED_DOCUMENT_FILENAME=" + (doc.filename || ""));
    let working = null;
    let lastFailure = null;
    for (const payload of workingPayloads(doc, preview.json)) {
      const res = await request(server.baseUrl, "POST", "/api/documents/working-docx", payload);
      if (res.status < 400 && res.json?.ok && res.json?.workingDocument?.driveItemId) { working = res.json.workingDocument; break; }
      lastFailure = { status: res.status, json: res.json, text: res.text, payloadKeys: Object.keys(payload) };
    }
    if (!working?.driveItemId) {
      console.log("WORKING_DOC_FAILURE_REDACTED=" + redact(JSON.stringify(lastFailure, null, 2)).slice(0, 12000));
      fail("working DOCX driveItemId was not created");
    } else {
      pass("working DOCX driveItemId created/returned");
      console.log("WORKING_DOCUMENT_NAME=" + (working.name || ""));
      console.log("WORKING_DOCUMENT_DRIVE_ITEM_ID_REDACTED=***REDACTED***");
      assert(/\.docx$/i.test(String(working.name || "")) || working.webUrl || working.webLink, "working document exposes docx name or web link");
    }
    console.log("CONTRACT: Phase 42A may create a Graph working DOCX but does not call finalize for upload, does not convert to final PDF, and does not upload to Clio.");
    console.log("RESULT: Phase 42A working-DOCX readiness no finalized upload smoke completed");
    if (failed) process.exit(1);
  } finally { stopServer(server.proc); }
})().catch((err) => { console.error(redact(err && err.stack ? err.stack : err)); process.exit(1); });
