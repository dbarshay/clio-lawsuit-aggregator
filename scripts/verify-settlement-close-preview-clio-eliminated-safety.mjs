import fs from "fs";
import http from "http";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function request(method, path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 3000,
        path,
        method,
        timeout: 15000,
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {}
          resolve({ status: res.statusCode, raw, json });
        });
      }
    );

    req.on("timeout", () => req.destroy(new Error(`${method} ${path} timed out`)));
    req.on("error", reject);
    req.end();
  });
}

const route = fs.readFileSync("app/api/settlements/close-preview/route.ts", "utf8");
const matterPage = fs.readFileSync("app/matter/[id]/page.tsx", "utf8");
const candidates = fs.readFileSync("app/api/advanced-search/candidates/route.ts", "utf8");

assert(route.includes("legacyClioOperationalRouteBlocked"), "settlement close-preview route must use blocker.");
assert(!route.includes("clioFetch"), "settlement close-preview route must not import/call clioFetch.");
assert(!route.includes("custom_field_values"), "settlement close-preview route must not read Clio custom fields.");
assert(!route.includes("/api/v4/matters"), "settlement close-preview route must not read Clio matters.");

assert(!matterPage.includes('"/api/settlements/close-preview"'), "direct matter page must not call settlement close-preview route.");
assert(!matterPage.includes("Clio remains the source of truth"), "direct matter UI must not say Clio remains source of truth.");
assert(!matterPage.includes("Clio-backed"), "direct matter UI must not say Clio-backed for operational workflows.");
assert(!matterPage.includes("Refreshing matter workspace from Clio"), "direct matter UI must not say workspace refreshes from Clio.");
assert(!matterPage.includes("Refresh Clio Values"), "direct matter settlement UI must not expose Refresh Clio Values.");
assert(!matterPage.includes("Current Clio Settlement Values"), "direct matter settlement UI must not expose Current Clio Settlement Values.");

assert(!candidates.includes("Clio-hydrate"), "advanced candidates route must not mention Clio hydration.");
assert(!candidates.includes("Clio hydration is required"), "advanced candidates route must not require Clio hydration.");

const closePreviewGet = await request("GET", "/api/settlements/close-preview");
assert(closePreviewGet.status === 410, `GET close-preview expected 410, got ${closePreviewGet.status}: ${closePreviewGet.raw.slice(0, 500)}`);
assert(closePreviewGet.json?.writes?.writesClio === false, "GET close-preview must report writesClio=false.");

const closePreviewPost = await request("POST", "/api/settlements/close-preview");
assert(closePreviewPost.status === 410, `POST close-preview expected 410, got ${closePreviewPost.status}: ${closePreviewPost.raw.slice(0, 500)}`);
assert(closePreviewPost.json?.writes?.writesClio === false, "POST close-preview must report writesClio=false.");

console.log("RESULT: settlement close preview Clio eliminated safety");
console.log("SETTLEMENT_CLOSE_PREVIEW_CLIO_ELIMINATED_STATUS=0");
console.log("CLOSE_PREVIEW_ROUTE_BLOCKED=true");
console.log("DIRECT_UI_CLOSE_PREVIEW_CALL_REMOVED=true");
console.log("OPERATIONAL_CLIO_TRUTH_TEXT_REMOVED=true");
console.log("WRITES_CLIO=false");
