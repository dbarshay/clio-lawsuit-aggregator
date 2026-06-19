const http = require("http");
const { spawn } = require("child_process");

const PORT = Number(process.env.PHASE34G_PORT || 3318);
const BASE = `http://127.0.0.1:${PORT}`;

const BODY = {
  masterLawsuitId: "2026.05.00001",
  useSingleMasterClioStorage: true,
  singleMasterDryRun: true,
  singleMasterResolveFolders: true
};

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : "";
    const req = http.request(
      `${BASE}${path}`,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data)
        }
      },
      (res) => {
        let chunks = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          chunks += chunk;
        });
        res.on("end", () => {
          let json = null;
          try {
            json = chunks ? JSON.parse(chunks) : null;
          } catch {}
          resolve({ status: res.statusCode, body: chunks, json });
        });
      }
    );

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
  console.log("RESULT: Phase 34G finalize live resolver blocked API smoke starting");

  const child = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", String(PORT)],
    {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED: "",
        CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED: "",
        CLIO_SINGLE_MASTER_LIVE_WRITE_COMMAND: "",
        PHASE_34G_SMOKE: "1"
      }
    }
  );

  try {
    let ready = false;

    for (let i = 0; i < 60; i++) {
      try {
        const res = await request("GET", "/", null);
        if (res.status && res.status < 500) {
          ready = true;
          break;
        }
      } catch {}
      await wait(1000);
    }

    assert(ready, "local dev server became reachable");

    const res = await request("POST", "/api/documents/finalize", BODY);

    console.log("HTTP_STATUS=" + res.status);
    console.log("RESPONSE_JSON=" + JSON.stringify(res.json, null, 2));

    assert(res.status === 400, "finalize returns 400 when live resolver is requested");
    assert(res.json && res.json.ok === false, "response ok false");
    assert(res.json.finalizeRewired === true, "finalizeRewired true");
    assert(res.json.uploadRewired === false, "uploadRewired false");
    assert(res.json.databaseMutation === false, "databaseMutation false");
    assert(res.json.clioWrite === false, "clioWrite false");
    assert(res.json.noUploadPerformed === true, "noUploadPerformed true");
    assert(res.json.generationSkipped === true, "generationSkipped true");
    assert(res.json.resolverBlocked === true, "resolverBlocked true");
    assert(res.json.error === "Live folder resolution remains disabled until finalize live folder resolution is explicitly enabled and smoke-tested.", "blocked error uses current resolver-disabled message");
    assert(res.json.singleMasterTargetInput.displayNumber === "2026.05.00001", "target displayNumber remains lawsuit number");
    assert(res.json.singleMasterTargetInput.bmMatterId === "2026.05.00001", "target bmMatterId remains lawsuit number");
    assert(res.json.singleMasterTargetInput.lawsuitId === "2026.05.00001", "target lawsuitId remains lawsuit number");

    console.log("PASS: no Clio folder was created by this API smoke");
    console.log("PASS: no upload was performed by this API smoke");
    console.log("PASS: no database mutation was performed by this API smoke");
    console.log("RESULT: Phase 34G finalize live resolver blocked API smoke passed");
  } finally {
    child.kill("SIGTERM");
    await wait(500);
    if (!child.killed) child.kill("SIGKILL");
  }
})().catch((err) => {
  console.error("FAIL:", err && err.stack ? err.stack : err);
  process.exit(1);
});
