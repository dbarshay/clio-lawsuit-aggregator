import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

let failures = 0;
function pass(message) {
  console.log("PASS:", message);
}
function fail(message) {
  failures += 1;
  console.log("FAIL:", message);
}
function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}
function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

function loadTsModuleForVerifierOnly(file) {
  const source = read(file);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      skipLibCheck: true,
    },
    fileName: file,
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    module,
    exports: module.exports,
    require,
    process,
    console,
    __dirname: path.dirname(path.resolve(file)),
    __filename: path.resolve(file),
  };
  vm.runInNewContext(transpiled, sandbox, { filename: `${file}.phase5b.cjs` });
  return module.exports;
}

const registryFile = "lib/adminpermissions.ts";
const packageFile = "package.json";
const proxyFile = "proxy.ts";
const sessionRouteFile = "app/api/auth/session/route.ts";
const permissionsRouteFile = "app/api/admin/permissions/route.ts";
const permissionsCheckRouteFile = "app/api/admin/permissions/check/route.ts";
const envDeploymentVerifierFile = "scripts/verify-admin-users-phase4-env-deployment-readiness-safety.mjs";

const registry = read(registryFile);
const pkg = JSON.parse(read(packageFile) || "{}");

assert(registry.includes("export function adminPermissionEnforcementDecision("), "adminPermissionEnforcementDecision export exists for isolated simulation");
assert(registry.includes("overrides = configuredAdminPermissionOverridesFromEnv()"), "decision helper accepts injected overrides for test-only simulation");
assert(registry.includes('return String(process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT ?? "").trim() === "1"'), "enforcement flag remains read-only and exact-match gated");
assert(registry.includes('"/admin/permissions"') && registry.includes('"/api/admin/permissions"') && registry.includes('"/api/admin/permissions/check"'), "never-block routes remain in registry");

for (const route of ["/api/admin/users/create", "/api/admin/users/assign-role", "/api/admin/users/remove-role", "/api/admin/users/permission-override"]) {
  const idx = registry.indexOf(`pattern: "${route}"`);
  const window = idx >= 0 ? registry.slice(idx, idx + 260) : "";
  assert(window.includes('permission: "admin.users.manage"') && window.includes('method: "POST"') && window.includes("enforcementPlanned: false"), `${route} remains mapped to admin.users.manage POST with enforcementPlanned false`);
}

const originalFlag = process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT;
const originalOverrides = process.env.BARSH_ADMIN_PERMISSION_OVERRIDES_JSON;

try {
  const permissions = loadTsModuleForVerifierOnly(registryFile);
  assert(typeof permissions.adminPermissionEnforcementDecision === "function", "verifier loads adminPermissionEnforcementDecision from TypeScript source without runtime deployment changes");
  assert(typeof permissions.configuredAdminPermissionOverridesFromEnv === "function", "verifier loads configuredAdminPermissionOverridesFromEnv from TypeScript source without runtime deployment changes");

  const injectedBlockUsersManage = {
    ok: true,
    source: "phase5-test-injected-overrides",
    enforcementEnabled: true,
    overrides: [{ permission: "admin.users.manage", action: "block", source: "phase5-test" }],
    errors: [],
  };

  delete process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT;
  let decision = permissions.adminPermissionEnforcementDecision("/api/admin/users/create", "POST", injectedBlockUsersManage);
  assert(decision.enforcementEnabled === false, "without temporary env flag, blocked override remains dry-run only");
  assert(decision.allowed === true && decision.blocked === false, "without temporary env flag, guarded create route remains allowed");
  assert(String(decision.reason || "").includes("would be blocked if enforcement were enabled"), "dry-run reason explains future blocked result without enforcing");

  process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT = "1";
  decision = permissions.adminPermissionEnforcementDecision("/api/admin/users/create", "POST", injectedBlockUsersManage);
  assert(decision.enforcementEnabled === true, "temporary process env enables simulation inside verifier only");
  assert(decision.permission === "admin.users.manage", "simulation maps create route to admin.users.manage");
  assert(decision.allowed === false && decision.blocked === true, "temporary simulation blocks create route when admin.users.manage is blocked");

  const assignDecision = permissions.adminPermissionEnforcementDecision("/api/admin/users/assign-role", "POST", injectedBlockUsersManage);
  const removeDecision = permissions.adminPermissionEnforcementDecision("/api/admin/users/remove-role", "POST", injectedBlockUsersManage);
  const overrideDecision = permissions.adminPermissionEnforcementDecision("/api/admin/users/permission-override", "POST", injectedBlockUsersManage);
  assert(assignDecision.blocked === true && removeDecision.blocked === true && overrideDecision.blocked === true, "temporary simulation blocks all four guarded admin users manage write routes");

  const neverBlockPage = permissions.adminPermissionEnforcementDecision("/admin/permissions", "GET", injectedBlockUsersManage);
  const neverBlockApi = permissions.adminPermissionEnforcementDecision("/api/admin/permissions", "GET", injectedBlockUsersManage);
  const neverBlockCheck = permissions.adminPermissionEnforcementDecision("/api/admin/permissions/check", "GET", injectedBlockUsersManage);
  assert(neverBlockPage.allowed === true && neverBlockPage.blocked === false, "never-block permissions page remains allowed during simulated enforcement");
  assert(neverBlockApi.allowed === true && neverBlockApi.blocked === false, "never-block permissions API remains allowed during simulated enforcement");
  assert(neverBlockCheck.allowed === true && neverBlockCheck.blocked === false, "never-block permission check API remains allowed during simulated enforcement");

  const unmatched = permissions.adminPermissionEnforcementDecision("/api/not-yet-mapped", "POST", injectedBlockUsersManage);
  assert(unmatched.allowed === true && unmatched.blocked === false && unmatched.permission === null, "unmatched routes remain default-allow during simulation");

  process.env.BARSH_ADMIN_PERMISSION_OVERRIDES_JSON = JSON.stringify({ block: ["admin.users.manage"] });
  const envOverrides = permissions.configuredAdminPermissionOverridesFromEnv();
  assert(envOverrides.ok === true && envOverrides.overrides.some((entry) => entry.permission === "admin.users.manage" && entry.action === "block"), "temporary override JSON can simulate block decisions inside verifier only");
} catch (error) {
  fail(error?.stack || error?.message || "Phase 5 simulation verifier threw an unknown error");
} finally {
  if (originalFlag === undefined) delete process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT;
  else process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT = originalFlag;
  if (originalOverrides === undefined) delete process.env.BARSH_ADMIN_PERMISSION_OVERRIDES_JSON;
  else process.env.BARSH_ADMIN_PERMISSION_OVERRIDES_JSON = originalOverrides;
}

assert(process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT === originalFlag, "verifier restores BARSH_ADMIN_PERMISSIONS_ENFORCEMENT after simulation");
assert(process.env.BARSH_ADMIN_PERMISSION_OVERRIDES_JSON === originalOverrides, "verifier restores BARSH_ADMIN_PERMISSION_OVERRIDES_JSON after simulation");

const runtimeSources = [registryFile, proxyFile, sessionRouteFile, permissionsRouteFile, permissionsCheckRouteFile, packageFile].map((file) => `${file}\n${read(file)}`).join("\n");
for (const forbidden of ["BARSH_ADMIN_PERMISSIONS_ENFORCEMENT=1", "process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT =", "enforcementPlanned: true"]) {
  assert(!runtimeSources.includes(forbidden), `runtime/config sources do not contain activation fragment: ${forbidden}`);
}

assert(read(envDeploymentVerifierFile).includes("/BARSH_ADMIN_PERMISSIONS_ENFORCEMENT\\s*=\\s*1/"), "Phase 4 env/deployment verifier still guards against persisted activation");
assert(pkg.scripts?.["verify:admin-users-phase5-enforcement-simulation-negative-path-safety"] === "node scripts/verify-admin-users-phase5-enforcement-simulation-negative-path-safety.mjs", "package script is registered for Phase 5B verifier");

console.log("\nRESULT: admin users phase 5 enforcement simulation negative-path safety verifier");
console.log(`FAILURES=${failures}`);
if (failures) process.exit(1);
console.log("PASS: Phase 5B proves enforcement decisions can be simulated only inside verifier process env, negative paths block as expected, never-block routes remain open, and runtime/deployment enforcement remains non-activating.");
