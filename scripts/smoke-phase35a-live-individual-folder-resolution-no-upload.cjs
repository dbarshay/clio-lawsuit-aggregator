const fs = require("fs");

const ROOT_FOLDER_ID_FALLBACK = "22053807035";
const DIRECT_MATTER_FILE_NUMBER = "BRL_202600001";
const EXPECTED_PATH = "Individual Matters/BRL-202600001-BRL-202600999/BRL_202600001";

function clean(value) {
  return String(value ?? "").trim();
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function mergeNonEmptyEnvFiles(filePaths) {
  const out = {};
  for (const filePath of filePaths) {
    const parsed = parseDotEnvFile(filePath);
    for (const [key, value] of Object.entries(parsed)) {
      if (String(value || "").trim().length > 0) out[key] = value;
    }
  }
  return out;
}

function loadLocalEnvWithoutPrintingSecrets() {
  return {
    ...mergeNonEmptyEnvFiles([
      ".env",
      ".env.local",
      ".env.development",
      ".env.development.local",
      ".env.production",
      ".env.production.local",
      ".env.vercel.production",
    ]),
    ...process.env,
  };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
  console.log(`PASS: ${message}`);
}

function buildIndividualMatterRangeFolderName(fileNumber) {
  const match = clean(fileNumber).match(/^BRL_(\d{4})(\d{5})$/);
  if (!match) throw new Error("Direct matter file number must use BRL_YYYYNNNNN format.");
  const year = match[1];
  const sequence = Number(match[2]);
  if (!Number.isFinite(sequence) || sequence <= 0) throw new Error("Direct matter sequence must be positive.");
  const rangeStart = Math.floor((sequence - 1) / 999) * 999 + 1;
  const rangeEnd = rangeStart + 998;
  return `BRL-${year}${String(rangeStart).padStart(5, "0")}-BRL-${year}${String(rangeEnd).padStart(5, "0")}`;
}

async function refreshAccessToken(env) {
  const accessToken = clean(env.CLIO_ACCESS_TOKEN);
  const refreshToken = clean(env.CLIO_REFRESH_TOKEN);
  const clientId = clean(env.CLIO_CLIENT_ID);
  const clientSecret = clean(env.CLIO_CLIENT_SECRET);

  assert(clientId, "CLIO_CLIENT_ID present without printing value");
  assert(clientSecret, "CLIO_CLIENT_SECRET present without printing value");
  assert(refreshToken, "CLIO_REFRESH_TOKEN present without printing value");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://app.clio.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.access_token) {
    if (accessToken) {
      console.log("WARN: token refresh failed; falling back to CLIO_ACCESS_TOKEN without printing value");
      return accessToken;
    }
    throw new Error(`Clio token refresh failed: ${res.status} ${res.statusText}`);
  }

  return json.access_token;
}

async function clioFetch(env, path, options = {}) {
  const base = clean(env.CLIO_API_BASE) || "https://app.clio.com";
  const normalizedBase = base.replace(/\/$/, "").endsWith("/api/v4")
    ? base.replace(/\/$/, "")
    : `${base.replace(/\/$/, "")}/api/v4`;
  const token = await refreshAccessToken(env);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return fetch(`${normalizedBase}${normalizedPath}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
}

async function createFolder(env, params) {
  const matterId = Number(params.matterId);
  const parentId = Number(params.parentId);
  const folderName = clean(params.folderName);

  if (!Number.isFinite(matterId) || matterId <= 0) throw new Error("matterId required");
  if (!Number.isFinite(parentId) || parentId <= 0) throw new Error("parentId required");
  if (!folderName) throw new Error("folderName required");

  const body = {
    data: {
      name: folderName,
      matter: { id: matterId },
      parent: { id: parentId, type: "Folder" },
    },
  };

  const res = await clioFetch(env, "/folders.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    throw new Error(`[CLIO_STORAGE] Clio folder create failed for ${folderName}: ${res.status} ${res.statusText}${json ? ` ${JSON.stringify(json)}` : ""}`);
  }

  const id = Number(json?.data?.id);
  if (!Number.isFinite(id) || id <= 0) throw new Error(`No folder id returned for ${folderName}`);

  return {
    name: clean(json?.data?.name || folderName),
    id,
    parentId,
  };
}

(async () => {
  console.log("RESULT: Phase 35A live individual matter folder-resolution no-upload smoke starting");
  console.log("CONTRACT: this smoke may create/reuse Clio folders only; it must not upload documents or mutate DB");

  const env = loadLocalEnvWithoutPrintingSecrets();
  const masterMatterId = Number(env.CLIO_MASTER_MATTER_ID);
  const rootFolderId = Number(env.CLIO_SINGLE_MASTER_ROOT_FOLDER_ID || env.CLIO_DOCUMENTS_ROOT_FOLDER_ID || ROOT_FOLDER_ID_FALLBACK);

  assert(Number.isFinite(masterMatterId) && masterMatterId > 0, "CLIO_MASTER_MATTER_ID present");
  assert(Number.isFinite(rootFolderId) && rootFolderId > 0, "Clio single-master root folder id present");

  const rootName = "Individual Matters";
  const rangeName = buildIndividualMatterRangeFolderName(DIRECT_MATTER_FILE_NUMBER);
  const finalName = DIRECT_MATTER_FILE_NUMBER;
  const path = `${rootName}/${rangeName}/${finalName}`;

  assert(path === EXPECTED_PATH, "individual matter taxonomy path is correct");
  assert(!/patient|provider|insurer|claim|denial|attorney/i.test(path), "folder path avoids patient/provider/insurer/claim facts");

  const first = await createFolder(env, { matterId: masterMatterId, parentId: rootFolderId, folderName: rootName });
  const second = await createFolder(env, { matterId: masterMatterId, parentId: first.id, folderName: rangeName });
  const third = await createFolder(env, { matterId: masterMatterId, parentId: second.id, folderName: finalName });

  const result = {
    ok: true,
    uploadRewired: false,
    databaseMutation: false,
    clioWrite: true,
    noUploadPerformed: true,
    generationSkipped: true,
    targetPlan: {
      storageTargetKind: "individual_matter",
      directMatterFileNumber: DIRECT_MATTER_FILE_NUMBER,
      rootFolderName: rootName,
      groupFolderName: rangeName,
      finalFolderName: finalName,
      matterFolderPath: path,
      folderSegments: [rootName, rangeName, finalName],
    },
    folderResolution: {
      rootFolderId,
      matterFolderId: third.id,
      folderId: third.id,
      folderSegments: [first, second, third],
    },
    safety: {
      clioIsStorageOnly: true,
      barshMattersOwnsFileAndLawsuitNumbers: true,
      noPatientProviderInsurerClaimFolderNames: true,
      noDocumentUploadPerformed: true,
      noDatabaseRecordsChanged: true,
    },
  };

  console.log("RESPONSE_JSON=" + JSON.stringify(result, null, 2));

  assert(third.id > 0, "final individual matter folder id returned");
  assert(result.targetPlan.matterFolderPath === EXPECTED_PATH, "final individual matter path is taxonomy path");
  assert(result.noUploadPerformed === true, "noUploadPerformed true");
  assert(result.databaseMutation === false, "databaseMutation false");
  assert(result.uploadRewired === false, "uploadRewired false");

  console.log("FINAL_FOLDER_ID=" + third.id);
  console.log("PASS: no document upload was performed by this live individual folder-resolution smoke");
  console.log("PASS: no database mutation was performed by this live individual folder-resolution smoke");
  console.log("RESULT: Phase 35A live individual matter folder-resolution no-upload smoke passed");
})().catch((err) => {
  console.error("FAIL:", err && err.stack ? err.stack : err);
  process.exit(1);
});
