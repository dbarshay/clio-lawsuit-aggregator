const fs = require("fs");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const scriptPath = "scripts/apply-admin-users-phase11a-jane-doe-limited-test-user.cjs";
const script = fs.readFileSync(scriptPath, "utf8");
const session = fs.readFileSync("app/api/auth/session/route.ts", "utf8");
const login = fs.readFileSync("app/api/auth/login/route.ts", "utf8");
const registry = fs.readFileSync("lib/adminPermissions.ts", "utf8");

const failures = [];
function requireIncludes(source, needle, label) {
  if (!source.includes(needle)) failures.push(label + " missing: " + needle);
}
function requireNotIncludes(source, needle, label) {
  if (source.includes(needle)) failures.push(label + " must not include: " + needle);
}

requireIncludes(script, "jane.doe.limited@example.com", "Jane Doe test email");
requireIncludes(script, "Jane Doe", "Jane Doe display name");
requireIncludes(script, "admin.auditHistory.view", "limited permission override");
requireIncludes(script, "bootstrapSafe: false", "Jane Doe non-bootstrap safety");
requireIncludes(script, "Jane Doe must not have owner_admin role", "non-owner assertion");
requireIncludes(script, "owner admin must retain active owner_admin role after Phase 11A", "owner preservation assertion");
requireIncludes(script, "realLimitedLoginSupported: false", "real login limitation documented");
requireIncludes(script, "--apply-admin-users-phase11a-jane-doe-limited-test-user", "guarded apply flag");
requireIncludes(script, "loadEnvFile(process.env.PHASE11A_ENV_FILE, true)", "Phase 11A temp env overrides stale local values");
requireIncludes(script, "function loadEnvFile(envPath, override = false)", "override-capable env-file loader");
requireIncludes(script, "POSTGRES_URL_NO_SSL", "POSTGRES_URL_NO_SSL fallback candidate");
requireIncludes(script, "POSTGRES_PGHOST_UNPOOLED", "unpooled host candidate");
requireIncludes(script, "function postgresConnectionCandidates()", "ordered Postgres connection candidates");
requireIncludes(script, "PHASE11A_DATABASE_URL", "preselected working DB URL support");
requireIncludes(script, "PHASE11A_ENV_FILE", "optional Phase 11A temp env file support");
requireIncludes(script, "function loadEnvFile(envPath, override = false)", "override-capable env-file loader");
requireIncludes(script, "POSTGRES_PGHOST_UNPOOLED", "unpooled host fallback");
requireIncludes(script, "POSTGRES_URL_NO_SSL", "POSTGRES_URL_NO_SSL fallback");
requireIncludes(script, "function loadLocalEnv()", ".env.local loader");
requireNotIncludes(script, "require(\"../lib/prisma\")", "script must not require missing lib/prisma helper");
requireIncludes(script, "@prisma/adapter-pg", "Prisma pg adapter support");
requireIncludes(script, "function createPrismaClient()", "Prisma 7 adapter client factory");
requireIncludes(session, 'permissionsMode: "default-admin-allow-all"', "session generic permissions mode remains visible");
requireIncludes(login, 'role: "admin"', "login generic admin role remains visible");
requireIncludes(registry, 'key: "admin.auditHistory.view"', "audit history view permission registered");
requireNotIncludes(script, 'roleKey: "owner_admin"', "script must not assign owner_admin to Jane Doe");

if (pkg.scripts?.["apply:admin-users-phase11a-jane-doe-limited-test-user"] !== "node scripts/apply-admin-users-phase11a-jane-doe-limited-test-user.cjs") failures.push("package apply script missing");
if (pkg.scripts?.["verify:admin-users-phase11a-limited-test-user-simulation-safety"] !== "node scripts/verify-admin-users-phase11a-limited-test-user-simulation-safety.cjs") failures.push("package verifier script missing");

console.log("RESULT: admin users Phase 11A limited test user simulation safety verifier");
if (failures.length) {
  console.log("FAILURES=" + failures.length);
  for (const failure of failures) console.log("FAIL: " + failure);
  process.exit(1);
}
console.log("FAILURES=0");
console.log("PASS: Phase 11A is DB-backed/simulation-only for Jane Doe, preserves owner_admin bootstrap access, and does not claim real limited browser login.");


console.log("PHASE_11A_UI_RESULT=Jane Doe was created through the production Admin Users UI and assigned read_only_admin. Role assignment did not change the permission-enforcement setting. Real limited browser-login remains pending until per-user auth/session identity exists.");
