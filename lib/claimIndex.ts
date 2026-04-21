import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "claim-index.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS claim_index (
    matter_id INTEGER PRIMARY KEY,
    display_number TEXT,
    description TEXT,

    claim_number_raw TEXT,
    claim_number_normalized TEXT,

    patient_name TEXT,
    client_name TEXT,
    insurer_name TEXT,

    claim_amount REAL,
    settled_amount REAL,
    payment_amount REAL,
    balance_amount REAL,

    bill_number TEXT,
    dos_start TEXT,
    dos_end TEXT,
    denial_reason TEXT,
    payment_voluntary REAL,
    balance_presuit REAL,
    master_lawsuit_id TEXT,

    status TEXT,
    raw_json TEXT,
    indexed_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_claim_number
  ON claim_index (claim_number_normalized);
`);

const existingColumns = db
  .prepare(`PRAGMA table_info(claim_index)`)
  .all() as Array<{ name: string }>;

const existingColumnNames = new Set(existingColumns.map((c) => c.name));

function ensureColumn(name: string, sqlType: string) {
  if (!existingColumnNames.has(name)) {
    db.exec(`ALTER TABLE claim_index ADD COLUMN ${name} ${sqlType}`);
  }
}

ensureColumn("bill_number", "TEXT");
ensureColumn("dos_start", "TEXT");
ensureColumn("dos_end", "TEXT");
ensureColumn("denial_reason", "TEXT");
ensureColumn("payment_voluntary", "REAL");
ensureColumn("balance_presuit", "REAL");
ensureColumn("master_lawsuit_id", "TEXT");
ensureColumn("client_name", "TEXT");

export function normalizeClaimNumber(value: any) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
}

export function upsertRow(row: any) {
  const stmt = db.prepare(`
    INSERT INTO claim_index (
      matter_id,
      display_number,
      description,
      claim_number_raw,
      claim_number_normalized,
      patient_name,
      client_name,
      insurer_name,
      claim_amount,
      settled_amount,
      payment_amount,
      balance_amount,
      bill_number,
      dos_start,
      dos_end,
      denial_reason,
      payment_voluntary,
      balance_presuit,
      master_lawsuit_id,
      status,
      raw_json,
      indexed_at
    ) VALUES (
      @matter_id,
      @display_number,
      @description,
      @claim_number_raw,
      @claim_number_normalized,
      @patient_name,
      @client_name,
      @insurer_name,
      @claim_amount,
      @settled_amount,
      @payment_amount,
      @balance_amount,
      @bill_number,
      @dos_start,
      @dos_end,
      @denial_reason,
      @payment_voluntary,
      @balance_presuit,
      @master_lawsuit_id,
      @status,
      @raw_json,
      @indexed_at
    )
    ON CONFLICT(matter_id) DO UPDATE SET
      display_number=excluded.display_number,
      description=excluded.description,
      claim_number_raw=excluded.claim_number_raw,
      claim_number_normalized=excluded.claim_number_normalized,
      patient_name=excluded.patient_name,
      client_name=excluded.client_name,
      insurer_name=excluded.insurer_name,
      claim_amount=excluded.claim_amount,
      settled_amount=excluded.settled_amount,
      payment_amount=excluded.payment_amount,
      balance_amount=excluded.balance_amount,
      bill_number=excluded.bill_number,
      dos_start=excluded.dos_start,
      dos_end=excluded.dos_end,
      denial_reason=excluded.denial_reason,
      payment_voluntary=excluded.payment_voluntary,
      balance_presuit=excluded.balance_presuit,
      master_lawsuit_id=excluded.master_lawsuit_id,
      status=excluded.status,
      raw_json=excluded.raw_json,
      indexed_at=excluded.indexed_at
  `);

  stmt.run({
    ...row,
    indexed_at: new Date().toISOString(),
  });
}

export function getMatter(matterId: number) {
  return db
    .prepare(`SELECT * FROM claim_index WHERE matter_id = ?`)
    .get(matterId);
}

export function getSiblings(normalized: string) {
  return db
    .prepare(
      `SELECT * FROM claim_index WHERE claim_number_normalized = ?`
    )
    .all(normalized);
}
