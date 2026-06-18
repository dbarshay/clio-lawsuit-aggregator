#!/usr/bin/env node
const fs = require("fs");
const { Pool } = require("pg");

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function read(path){ if(fs.existsSync(path) === false){ console.error("FAIL missing "+path); process.exit(1); } return fs.readFileSync(path,"utf8"); }
function assert(label, ok){ if(ok === false){ console.error("FAIL: "+label); process.exit(1); } console.log("PASS: "+label); }

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const next = source.indexOf("\nasync function", start + marker.length);
  const nextFunction = source.indexOf("\nfunction ", start + marker.length);
  const candidates = [next, nextFunction].filter((value) => value > start);
  const end = candidates.length ? Math.min(...candidates) : source.length;
  return source.slice(start, end);
}


async function main() {
  loadLocalEnv();
  console.log("RUN: Phase 13C active non-owner login readiness safety verifier");

  const pkg = JSON.parse(read("package.json"));
  const login = read("app/api/auth/login/route.ts");
  const loginPage = read("app/login/page.tsx");
  const session = read("app/api/auth/session/route.ts");
  const permissions = read("lib/adminPermissions.ts");
  const loginEligibilityBody = functionBody(login, "userIsEligibleForPhase13CUsernamePasswordLogin");

  assert("package script registered for Phase 13C", pkg.scripts && pkg.scripts["verify:admin-users-phase13c-non-owner-login-readiness-safety"] === "node scripts/verify-admin-users-phase13c-non-owner-login-readiness-safety.cjs");
  assert("login route has Phase 13C eligibility helper", login.includes("userIsEligibleForPhase13CUsernamePasswordLogin"));
  assert("login eligibility requires active status", loginEligibilityBody.includes('user.status === "active"'));
  assert("login eligibility requires passwordHash", loginEligibilityBody.includes("Boolean(user.passwordHash)"));
  assert("login eligibility no longer requires bootstrapSafe", !/bootstrapSafe\s*===\s*true/.test(loginEligibilityBody));
  assert("login eligibility no longer requires owner_admin", !/roleKeys\.includes\("owner_admin"\)/.test(loginEligibilityBody));
  assert("login still verifies bcrypt password hash", login.includes("bcrypt.compare(password, user.passwordHash)"));
  assert("login still records failed login", login.includes("recordFailedCredentialLogin"));
  assert("login still records successful login", login.includes("recordSuccessfulCredentialLogin"));
  assert("login writes signed identity cookie", login.includes("setAdminIdentityCookie(response") && login.includes("id: user.id"));
  assert("login still preserves legacy fallback", login.includes('credentialMode: "legacy-admin-password"'));
  assert("login returns role keys and passwordChangeRequired", login.includes("roleKeys: user.roleKeys") && login.includes("passwordChangeRequired: user.passwordChangeRequired"));
  assert("login page still redirects passwordChangeRequired users", loginPage.includes("/change-password") && loginPage.includes("passwordChangeRequired"));
  assert("session remains default allow-all/no enforcement", session.includes('permissionsMode: "default-admin-allow-all"') && session.includes("configuredAdminPermissionsEnforcementEnabled()"));
  assert("permission never-block routes remain present", permissions.includes("/admin") && permissions.includes("/admin/permissions") && permissions.includes("/api/admin/permissions") && permissions.includes("/api/admin/permissions/check"));

  assert("DATABASE_URL is configured", typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=require") ? undefined : { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    const jane = (await client.query(`SELECT * FROM "AdminUser" WHERE email = $1 LIMIT 1`, ["jane.doe.limited@example.com"])).rows[0];
    assert("DB Jane Doe exists", Boolean(jane));
    assert("DB Jane Doe username remains JDoe", jane.username === "JDoe");
    assert("DB Jane Doe passwordHash exists", typeof jane.passwordHash === "string" && jane.passwordHash.startsWith("$2"));
    assert("DB Jane Doe active", jane.status === "active");
    assert("DB Jane Doe passwordChangeRequired is boolean", typeof jane.passwordChangeRequired === "boolean");\n    console.log("INFO: DB Jane Doe passwordChangeRequired=" + jane.passwordChangeRequired + " (true before first-login change; false after successful Phase 14C manual smoke).");
    assert("DB Jane Doe non-bootstrap", jane.bootstrapSafe === false);

    const roles = (await client.query(
      `SELECT r.key FROM "AdminUserRole" ur JOIN "AdminRole" r ON r.id = ur."roleId" WHERE ur."userId" = $1 ORDER BY r.key`,
      [jane.id]
    )).rows.map((row) => row.key);
    assert("DB Jane Doe retains read_only_admin", roles.includes("read_only_admin"));
    assert("DB Jane Doe is not owner_admin", roles.includes("owner_admin") === false);
  } finally {
    client.release();
    await pool.end();
  }

  console.log("CONTRACT: Phase 13C permits active non-owner AdminUsers with passwordHash to authenticate.");
  console.log("CONTRACT: Jane Doe can login as JDoe; before first-login change she is redirected to /change-password, and after manual smoke passwordChangeRequired may be false.");
  console.log("CONTRACT: Permission enforcement remains off; no page/function restrictions are activated in Phase 13C.");
  console.log("PASS: Phase 13C active non-owner login readiness is no-enforcement safe.");
}

main().catch((error)=>{ console.error("FAIL:", error.message || error); process.exit(1); });
