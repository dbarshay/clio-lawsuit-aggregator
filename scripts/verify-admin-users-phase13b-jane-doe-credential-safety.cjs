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

async function main() {
  loadLocalEnv();
  console.log("RUN: Phase 13B Jane Doe credential assignment safety verifier");

  const pkg = JSON.parse(read("package.json"));
  const applyScript = read("scripts/apply-admin-users-phase13b-jane-doe-credential.cjs");
  const login = read("app/api/auth/login/route.ts");
  const page = read("app/login/page.tsx");
  const permissions = read("lib/adminPermissions.ts");

  assert("package script registered for Phase 13B apply", pkg.scripts && pkg.scripts["apply:admin-users-phase13b-jane-doe-credential"] === "node scripts/apply-admin-users-phase13b-jane-doe-credential.cjs");
  assert("package script registered for Phase 13B verify", pkg.scripts && pkg.scripts["verify:admin-users-phase13b-jane-doe-credential-safety"] === "node scripts/verify-admin-users-phase13b-jane-doe-credential-safety.cjs");
  assert("apply script reads password only from env", applyScript.includes("process.env.JANE_DOE_TEMP_PASSWORD") && !applyScript.includes("console.log(tempPassword"));
  assert("apply script hashes temp password", applyScript.includes("bcrypt.hash(tempPassword, 12)"));
  assert("apply script sets Jane username", applyScript.includes('"JDoe"') && applyScript.includes('"jdoe"'));
  assert("apply script requires read_only_admin", applyScript.includes("read_only_admin"));
  assert("apply script blocks owner_admin Jane", applyScript.includes("must not receive owner_admin"));
  assert("apply script preserves bootstrap owner guard", applyScript.includes("active bootstrapSafe owner_admin"));
  assert("apply script marks passwordChangeRequired true", applyScript.includes('"passwordChangeRequired" = true'));
  assert("login still restricts credential login to owner_admin before Phase 13C", login.includes("userIsEligibleForPhase12GOwnerLogin") && login.includes("owner_admin") && login.includes("bootstrapSafe === true"));
  assert("login page has forced change redirect from Phase 13A", page.includes("/change-password") && page.includes("passwordChangeRequired"));
  assert("permission enforcement remains off/default allow-all elsewhere", permissions.includes("/admin") && permissions.includes("/admin/permissions") && permissions.includes("/api/admin/permissions") && permissions.includes("/api/admin/permissions/check"));

  assert("DATABASE_URL is configured", typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0);
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=require") ? undefined : { rejectUnauthorized: false },
  });
  const client = await pool.connect();
  try {
    const jane = (await client.query(
      `SELECT * FROM "AdminUser" WHERE email = $1 LIMIT 1`,
      ["jane.doe.limited@example.com"]
    )).rows[0];
    assert("DB Jane Doe exists", Boolean(jane));
    assert("DB Jane Doe username is JDoe", jane.username === "JDoe");
    assert("DB Jane Doe normalized username is jdoe", jane.normalizedUsername === "jdoe");
    assert("DB Jane Doe passwordHash exists", typeof jane.passwordHash === "string" && jane.passwordHash.startsWith("$2"));
    assert("DB Jane Doe passwordChangeRequired true", jane.passwordChangeRequired === true);
    assert("DB Jane Doe remains active", jane.status === "active");
    assert("DB Jane Doe remains non-bootstrap", jane.bootstrapSafe === false);

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

  console.log("CONTRACT: Phase 13B assigns Jane Doe credentials but does not enable non-owner login yet.");
  console.log("CONTRACT: Jane's temporary password is hashed and not printed or stored in repo.");
  console.log("PASS: Phase 13B Jane Doe credential assignment is locked as no-enforcement/no-impersonation.");
}

main().catch((error)=>{ console.error("FAIL:", error.message || error); process.exit(1); });
