const fs = require("fs");

const PROD_URL = process.env.PHASE40_PROD_URL || "https://clio-lawsuit-aggregator.vercel.app";
const MASTER_LAWSUIT_ID = "2026.05.00001";
const FINAL_FOLDER_ID = 22062362060;
const CLIO_DOCUMENT_ID = 22068617600;
const FINALIZATION_RECORD_ID = 103;
const EXPECTED_PATH = "Lawsuits/2026-05/2026.05.00001";

function clean(value) {
  return String(value ?? "").trim();
}

function redact(value) {
  return String(value || "")
    .replace(/(client_secret=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(refresh_token=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(access_token=)[^&\s"]+/gi, "$1***REDACTED***")
    .replace(/(Authorization:\s*Bearer\s+)[^\s"]+/gi, "$1***REDACTED***")
    .replace(/(CLIO_CLIENT_SECRET=).+/gi, "$1***REDACTED***")
    .replace(/(CLIO_REFRESH_TOKEN=).+/gi, "$1***REDACTED***")
    .replace(/(DATABASE_URL=).+/gi, "$1***REDACTED***");
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

async function clioFetch(path, env) {
  const base = clean(env.CLIO_API_BASE) || "https://app.clio.com";
  const apiBase = base.replace(/\/$/, "").endsWith("/api/v4") ? base.replace(/\/$/, "") : `${base.replace(/\/$/, "")}/api/v4`;
  const refreshToken = clean(env.CLIO_REFRESH_TOKEN);
  const clientId = clean(env.CLIO_CLIENT_ID);
  const clientSecret = clean(env.CLIO_CLIENT_SECRET);

  if (!refreshToken || !clientId || !clientSecret) {
    throw new Error("Missing Clio OAuth env values.");
  }

  const tokenRes = await fetch(`${apiBase.replace(/\/api\/v4$/, "")}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const tokenJson = await tokenRes.json().catch(() => null);
  if (!tokenRes.ok || !tokenJson?.access_token) {
    throw new Error(`Clio token refresh failed: ${tokenRes.status} ${tokenRes.statusText} ${JSON.stringify(tokenJson)}`);
  }

  const url = path.startsWith("http") ? path : `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: "application/json"
    }
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 700) }; }

  if (!res.ok) {
    throw new Error(`Clio GET failed: ${res.status} ${res.statusText} ${JSON.stringify(json)}`);
  }

  return json;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

async function productionJsonSmoke() {
  const body = {
    masterLawsuitId: MASTER_LAWSUIT_ID,
    useSingleMasterClioStorage: true,
    singleMasterDryRun: true,
    singleMasterResolveFolders: false
  };

  const res = await fetch(`${PROD_URL}/api/documents/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  console.log("PRODUCTION_PREVIEW_STATUS=" + res.status);
  console.log("PRODUCTION_PREVIEW_JSON=" + JSON.stringify(json, null, 2));

  assert(res.status === 200, "production no-upload preview status is 200");
  assert(json?.ok === true, "production no-upload preview ok true");
  assert(json?.uploadRewired === false, "production no-upload preview uploadRewired false");
  assert(json?.databaseMutation === false, "production no-upload preview databaseMutation false");
  assert(json?.noUploadPerformed === true, "production no-upload preview noUploadPerformed true");
  assert(json?.folderResolutionMode === "preview-only-no-clio-call", "production no-upload preview does not call Clio");
  assert(json?.folderResolution?.targetPlan?.masterMatterId === 1885821245, "production target master matter id correct");
  assert(json?.folderResolution?.targetPlan?.masterMatterName === "Barsh Matters Master Repository", "production target master matter name correct");
  assert(json?.folderResolution?.targetPlan?.matterFolderPath === EXPECTED_PATH, "production target folder path correct");
}

async function clioVisibilitySmoke(env) {
  const fields = encodeURIComponent("id,name,filename,parent{id,type},latest_document_version{id,uuid,filename,size,content_type,fully_uploaded,received_at,created_at,updated_at}");
  const folderDocs = await clioFetch(`/documents.json?parent_id=${encodeURIComponent(String(FINAL_FOLDER_ID))}&limit=200&fields=${fields}`, env);
  const rows = Array.isArray(folderDocs?.data) ? folderDocs.data : [];
  const uploaded = rows.find((row) => Number(row?.id) === CLIO_DOCUMENT_ID);

  assert(Boolean(uploaded), `Clio uploaded document ${CLIO_DOCUMENT_ID} is visible under final folder ${FINAL_FOLDER_ID}`);
  assert(clean(uploaded?.parent?.type) === "Folder", "Clio uploaded document parent type is Folder");
  assert(Number(uploaded?.parent?.id) === FINAL_FOLDER_ID, "Clio uploaded document parent id is final folder id");
  assert(Boolean(uploaded?.latest_document_version?.fully_uploaded), "Clio uploaded document latest version is fully uploaded");
  assert(clean(uploaded?.name).toLowerCase().endsWith(".pdf"), "Clio uploaded document is a PDF");
}

async function dbAuditSmoke(env) {
  const pg = require("pg");
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query(
      'SELECT id, status, uploaded, "noUploadPerformed" FROM "DocumentFinalization" WHERE id = $1 LIMIT 1',
      [FINALIZATION_RECORD_ID]
    );
    const record = result.rows[0] || null;
    assert(Boolean(record), `DB finalization record ${FINALIZATION_RECORD_ID} exists`);
    assert(record.status === "uploaded-to-clio", "DB finalization record status is uploaded-to-clio");
    assert(record.noUploadPerformed === false, "DB finalization record noUploadPerformed is false");
    const uploadedRows = Array.isArray(record.uploaded) ? record.uploaded : [];
    assert(uploadedRows.some((row) => Number(row?.clioDocumentId) === CLIO_DOCUMENT_ID), "DB finalization record references Clio document id");
    assert(uploadedRows.some((row) => clean(row?.clioUploadParent?.type) === "Folder"), "DB finalization record references Folder upload parent");
    assert(uploadedRows.some((row) => Number(row?.clioUploadParent?.id) === FINAL_FOLDER_ID), "DB finalization record references final folder id");
  } finally {
    await client.end();
  }
}

(async () => {
  console.log("RESULT: Phase 40 production/UI/Clio visibility audit starting");
  console.log("CONTRACT: read-only audit only. No upload, no Clio write, no DB mutation, no test artifact cleanup.");

  const env = loadLocalEnvWithoutPrintingSecrets();
  for (const key of ["CLIO_CLIENT_ID", "CLIO_CLIENT_SECRET", "CLIO_REFRESH_TOKEN", "DATABASE_URL"]) {
    assert(clean(env[key]).length > 0, `${key} present without printing value`);
  }

  await productionJsonSmoke();
  await clioVisibilitySmoke(env);
  await dbAuditSmoke(env);

  console.log("PHASE40_PROD_URL=" + PROD_URL);
  console.log("PHASE40_FOLDER_PATH=" + EXPECTED_PATH);
  console.log("PHASE40_FINAL_FOLDER_ID=" + FINAL_FOLDER_ID);
  console.log("PHASE40_CLIO_DOCUMENT_ID=" + CLIO_DOCUMENT_ID);
  console.log("PHASE40_FINALIZATION_RECORD_ID=" + FINALIZATION_RECORD_ID);
  console.log("RESULT: Phase 40 production/UI/Clio visibility audit passed");
})().catch((err) => {
  console.error("FAIL:", err && err.stack ? redact(err.stack) : redact(err));
  process.exit(1);
});
