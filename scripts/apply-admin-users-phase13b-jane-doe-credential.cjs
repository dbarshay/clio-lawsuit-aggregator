#!/usr/bin/env node
const fs = require("fs");
const bcrypt = require("bcryptjs");
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

function passwordPolicyErrors(password) {
  const errors = [];
  if (password.length < 10) errors.push("Password must be at least 10 characters.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include at least one uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must include at least one lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must include at least one number.");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password must include at least one symbol.");
  return errors;
}

async function main() {
  loadLocalEnv();
  const tempPassword = String(process.env.JANE_DOE_TEMP_PASSWORD || "");
  const errors = passwordPolicyErrors(tempPassword);
  if (errors.length) {
    console.error("FAIL: JANE_DOE_TEMP_PASSWORD does not meet policy.");
    for (const error of errors) console.error("- " + error);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("FAIL: DATABASE_URL is not configured.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes("sslmode=require") ? undefined : { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const janeResult = await client.query(
      `SELECT id, email, username, "normalizedUsername", "passwordHash", status, "bootstrapSafe", "passwordChangeRequired"
       FROM "AdminUser"
       WHERE email = $1
       LIMIT 1`,
      ["jane.doe.limited@example.com"]
    );

    if (janeResult.rowCount !== 1) {
      throw new Error("Jane Doe AdminUser row was not found.");
    }

    const jane = janeResult.rows[0];
    if (jane.bootstrapSafe === true) {
      throw new Error("Jane Doe must not be bootstrapSafe.");
    }

    const roleResult = await client.query(
      `SELECT r.key
       FROM "AdminUserRole" ur
       JOIN "AdminRole" r ON r.id = ur."roleId"
       WHERE ur."userId" = $1
       ORDER BY r.key`,
      [jane.id]
    );

    const roleKeys = roleResult.rows.map((row) => row.key);
    if (!roleKeys.includes("read_only_admin")) {
      throw new Error("Jane Doe must retain read_only_admin before credentials are assigned.");
    }
    if (roleKeys.includes("owner_admin")) {
      throw new Error("Jane Doe must not receive owner_admin credentials.");
    }

    const ownerResult = await client.query(
      `SELECT COUNT(*)::int AS count
       FROM "AdminUser" u
       JOIN "AdminUserRole" ur ON ur."userId" = u.id
       JOIN "AdminRole" r ON r.id = ur."roleId"
       WHERE u.status = 'active' AND u."bootstrapSafe" = true AND r.key = 'owner_admin' AND r.status = 'active'`
    );
    if (Number(ownerResult.rows[0]?.count || 0) < 1) {
      throw new Error("No active bootstrapSafe owner_admin exists. Refusing to assign Jane credentials.");
    }

    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await client.query(
      `UPDATE "AdminUser"
       SET username = $1,
           "normalizedUsername" = $2,
           "passwordHash" = $3,
           "passwordSetAt" = NOW(),
           "passwordChangeRequired" = true,
           "failedLoginCount" = 0,
           "lastFailedLoginAt" = NULL,
           notes = COALESCE(notes || E'\n', '') || $4
       WHERE id = $5`,
      ["JDoe", "jdoe", passwordHash, `[${new Date().toISOString()}] PHASE 13B credential assignment: username JDoe, password hash set, change required.`, jane.id]
    );

    await client.query("COMMIT");

    const verify = await client.query(
      `SELECT email, username, "normalizedUsername", "passwordHash", status, "bootstrapSafe", "passwordChangeRequired"
       FROM "AdminUser"
       WHERE email = $1
       LIMIT 1`,
      ["jane.doe.limited@example.com"]
    );

    const row = verify.rows[0];
    console.log("PASS: Jane Doe credentials assigned.");
    console.log("EMAIL=" + row.email);
    console.log("USERNAME=" + row.username);
    console.log("NORMALIZED_USERNAME=" + row.normalizedUsername);
    console.log("PASSWORD_HASH_SET=" + Boolean(row.passwordHash && row.passwordHash.startsWith("$2")));
    console.log("PASSWORD_CHANGE_REQUIRED=" + row.passwordChangeRequired);
    console.log("STATUS=" + row.status);
    console.log("BOOTSTRAP_SAFE=" + row.bootstrapSafe);
    console.log("PASSWORD_EXPOSED=false");
    console.log("IMPERSONATION_ENABLED=false");
    console.log("PERMISSION_ENFORCEMENT_ENABLED=false");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("FAIL:", error.message || error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("FAIL:", error.message || error);
  process.exit(1);
});
