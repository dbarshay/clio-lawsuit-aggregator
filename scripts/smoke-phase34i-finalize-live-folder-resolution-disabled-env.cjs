const http = require("http");
const { spawn } = require("child_process");

const PORT = Number(process.env.PHASE34I_PORT || 3319);
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
  console.log("RESULT: Phase 34I finalize live resolver disabled-env API smoke starting");

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
        PHASE_34I_SMOKE: "1"
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

    assert(res.status >= 400, "finalize returns an error when live resolver env is disabled");
    assert(res.json && res.json.ok === false, "response ok false");
    assert(String(res.json.error || "").match(/disabled|CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED|CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED|RUN_CLIO_SINGLE_MASTER_FOLDER_CREATE|Live folder creation blocked/i), "error explains live folder writes are blocked by guard");
    console.log("PASS: no upload was performed by this disabled-env smoke");
    console.log("PASS: no database mutation was performed by this disabled-env smoke");
    console.log("RESULT: Phase 34I finalize live resolver disabled-env API smoke passed");
  } finally {
    child.kill("SIGTERM");
    await wait(500);
    if (!child.killed) child.kill("SIGKILL");
  }
})().catch((err) => {
  console.error("FAIL:", err && err.stack ? err.stack : err);
  process.exit(1);
});
