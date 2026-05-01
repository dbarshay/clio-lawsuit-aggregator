import { clioFetch } from "@/lib/clio";
import { upsertRow, normalizeClaimNumber } from "@/lib/claimIndex";
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
  CREATE TABLE IF NOT EXISTS claim_refresh_log (
    claim_number_normalized TEXT PRIMARY KEY,
    last_attempted_at TEXT,
    last_succeeded_at TEXT,
    last_error TEXT
  );
`);

const COOLDOWN_MS = 10 * 60 * 1000;

function getRefreshLog(normalized: string) {
  return db
    .prepare(
      `SELECT claim_number_normalized, last_attempted_at, last_succeeded_at, last_error
       FROM claim_refresh_log
       WHERE claim_number_normalized = ?`
    )
    .get(normalized) as
    | {
        claim_number_normalized: string;
        last_attempted_at: string | null;
        last_succeeded_at: string | null;
        last_error: string | null;
      }
    | undefined;
}

function markAttempt(normalized: string) {
  db.prepare(`
    INSERT INTO claim_refresh_log (
      claim_number_normalized,
      last_attempted_at,
      last_succeeded_at,
      last_error
    ) VALUES (
      @claim_number_normalized,
      @last_attempted_at,
      NULL,
      NULL
    )
    ON CONFLICT(claim_number_normalized) DO UPDATE SET
      last_attempted_at=excluded.last_attempted_at
  `).run({
    claim_number_normalized: normalized,
    last_attempted_at: new Date().toISOString(),
  });
}

function markSuccess(normalized: string) {
  db.prepare(`
    INSERT INTO claim_refresh_log (
      claim_number_normalized,
      last_attempted_at,
      last_succeeded_at,
      last_error
    ) VALUES (
      @claim_number_normalized,
      @last_attempted_at,
      @last_succeeded_at,
      NULL
    )
    ON CONFLICT(claim_number_normalized) DO UPDATE SET
      last_attempted_at=excluded.last_attempted_at,
      last_succeeded_at=excluded.last_succeeded_at,
      last_error=NULL
  `).run({
    claim_number_normalized: normalized,
    last_attempted_at: new Date().toISOString(),
    last_succeeded_at: new Date().toISOString(),
  });
}

function markError(normalized: string, error: string) {
  db.prepare(`
    INSERT INTO claim_refresh_log (
      claim_number_normalized,
      last_attempted_at,
      last_succeeded_at,
      last_error
    ) VALUES (
      @claim_number_normalized,
      @last_attempted_at,
      NULL,
      @last_error
    )
    ON CONFLICT(claim_number_normalized) DO UPDATE SET
      last_attempted_at=excluded.last_attempted_at,
      last_error=excluded.last_error
  `).run({
    claim_number_normalized: normalized,
    last_attempted_at: new Date().toISOString(),
    last_error: error,
  });
}

export async function refreshClaimIndex(
  claimNumber: string,
  options?: { force?: boolean }
) {
  if (!claimNumber) {
    return {
      refreshed: false,
      skipped: true,
      reason: "missing-claim-number",
    };
  }

  const normalizedTarget = normalizeClaimNumber(claimNumber);
  const force = !!options?.force;
  const log = getRefreshLog(normalizedTarget);

  if (!force && log?.last_attempted_at) {
    const lastAttemptMs = new Date(log.last_attempted_at).getTime();

    if (
      Number.isFinite(lastAttemptMs) &&
      Date.now() - lastAttemptMs < COOLDOWN_MS
    ) {
      return {
        refreshed: false,
        skipped: true,
        reason: "cooldown",
        lastAttemptedAt: log.last_attempted_at,
        lastSucceededAt: log.last_succeeded_at,
        lastError: log.last_error,
      };
    }
  }

  markAttempt(normalizedTarget);

  let page = 1;
  const limit = 200;
  let matched = 0;

  try {
    while (true) {
      const res = await clioFetch(
        `/api/v4/matters.json?page=${page}&limit=${limit}&fields=id,display_number,description,custom_field_values`
      );

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Clio fetch failed: ${text}`);
      }

      const json = text ? JSON.parse(text) : null;
      const matters = Array.isArray(json?.data) ? json.data : [];

      if (matters.length === 0) break;

      for (const m of matters) {
        const id = Number(m.id);
        if (!id) continue;

        const getCF = (fieldId: number) =>
          m.custom_field_values?.find(
            (c: any) => Number(c.custom_field?.id) === fieldId
          )?.value;

        const rawClaim = getCF(22145915);
        const normalized = normalizeClaimNumber(rawClaim);

        if (normalized !== normalizedTarget) continue;

        matched += 1;

        upsertRow({
          matter_id: id,
          display_number: m.display_number || "",
          description: m.description || "",
          claim_number_raw: rawClaim || "",
          claim_number_normalized: normalized,
          patient_name: "",
          client_name: "",
          insurer_name: "",
          claim_amount: 0,
          settled_amount: 0,
          payment_amount: 0,
          balance_amount: 0,
          bill_number: "",
          dos_start: "",
          dos_end: "",
          denial_reason: "",
          payment_voluntary: 0,
          balance_presuit: 0,
          master_lawsuit_id: getCF(22294835) || "",
          status: "",
          raw_json: JSON.stringify(m),
        });
      }

      if (matters.length < limit) break;
      page += 1;
    }

    markSuccess(normalizedTarget);

    return {
      refreshed: true,
      skipped: false,
      matched,
      forced: force,
    };
  } catch (err: any) {
    const message = err?.message || "Unknown refresh error";
    markError(normalizedTarget, message);

    return {
      refreshed: false,
      skipped: false,
      error: message,
      rateLimited: message.includes("RateLimited"),
      forced: force,
    };
  }
}
