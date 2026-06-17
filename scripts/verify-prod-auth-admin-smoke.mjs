#!/usr/bin/env node
import https from "node:https";

const BASE = process.env.BARSH_PROD_BASE_URL || "https://clio-lawsuit-aggregator.vercel.app";

function request(path, method = "GET", follow = false, depth = 0) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE);
    const req = https.request(url, { method, timeout: 20000, headers: { "user-agent": "barsh-prod-auth-admin-smoke/1.0" } }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", async () => {
        const location = res.headers.location || "";
        if (follow && [301, 302, 303, 307, 308].includes(res.statusCode || 0) && location && depth < 5) {
          const nextUrl = location.startsWith("http") ? new URL(location) : new URL(location, BASE);
          resolve(await request(nextUrl.pathname + nextUrl.search, "GET", true, depth + 1));
          return;
        }
        resolve({ path, method, status: res.statusCode || 0, location, bytes: Buffer.byteLength(body), body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (error) => resolve({ path, method, status: 0, location: "", bytes: 0, body: "", error: error.message }));
    req.end();
  });
}

function pass(message) { console.log("PASS: " + message); }
function fail(message) { console.error("FAIL: " + message); process.exitCode = 1; }

console.log("RESULT: production auth/admin smoke verifier");
console.log("BASE=" + BASE);

const home = await request("/", "GET", true);
const login = await request("/login?from=/admin/permissions", "GET", true);
const admin = await request("/admin", "GET", false);
const adminPermissions = await request("/api/admin/permissions", "GET", false);
const session = await request("/api/auth/session", "GET", false);

for (const result of [home, login, admin, adminPermissions, session]) {
  console.log(result.method + " " + result.path + " HTTP=" + result.status + " LOCATION=" + (result.location || "-") + " BYTES=" + result.bytes + (result.error ? " ERROR=" + result.error : ""));
}

if (home.status === 200) pass("/ loads"); else fail("/ expected 200, got " + home.status);
if (login.status === 200) pass("/login?from=/admin/permissions loads"); else fail("/login expected 200, got " + login.status);
if ([301, 302, 303, 307, 308].includes(admin.status) && String(admin.location).includes("/login")) pass("/admin redirects unauthenticated users to /login"); else fail("/admin expected redirect to /login, got HTTP=" + admin.status + " LOCATION=" + (admin.location || "-"));
if (adminPermissions.status === 401) pass("/api/admin/permissions returns 401 unauthenticated"); else fail("/api/admin/permissions expected 401, got " + adminPermissions.status);
if (session.status === 200) pass("/api/auth/session returns 200"); else fail("/api/auth/session expected 200, got " + session.status);

if (process.exitCode) process.exit(process.exitCode);
console.log("PASS: production auth/admin smoke complete");

