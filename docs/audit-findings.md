# Codebase Audit — Findings & Remediation Tracker

Date: 2026-06-29. Method: four read-only review passes (security, stubbed/incomplete,
correctness/parity, build/lint), each citing code evidence. `npx tsc --noEmit` is clean.

Status key: `[ ]` open · `[~]` in progress · `[x]` done · `[-]` intentional / won't-fix.

---

## A. Security (highest priority — fix before real client PII is in production)

The access-control model rests almost entirely on `proxy.ts` (Next's renamed middleware),
which **fails open**, and most routes have no in-route guard.

- [ ] **A0 (BLOCKER to verify first) — Does the middleware even run?** `.next/server/middleware-manifest.json`
  has empty matchers, which *may* mean `proxy.ts` doesn't execute at runtime (or may be a
  Next 16 quirk). Resolve with a runtime probe (request an `/api/admin/*` route with no
  cookie) before designing the auth fix. If it doesn't run, every admin route is open.
- [ ] **A1 CRITICAL — `proxy.ts:109-126` fails OPEN.** `if (!gate) return NextResponse.next()`
  — a request with no cookie is allowed; only a *validly-signed* non-owner cookie is blocked.
  Fix: fail closed for `/admin` + `/api/admin` surfaces.
- [ ] **A2 CRITICAL — Privileged routes have no in-route auth.** `isAdminRequestAuthorized`
  is used only in `app/api/admin/users/**` and `app/api/auth/**`. No guard on:
  `admin/lawsuits/cleanup-confirm` (deletes), `admin/backups/run` (spawns process),
  `admin/clients/[id]` PATCH/GET (client PII), and most other admin routes. Fix: add
  `if (!isAdminRequestAuthorized(req)) return adminUnauthorizedJson();` to each.
- [ ] **A3 CRITICAL — `clio-document-open` IDOR.** `app/api/documents/clio-document-open/route.ts:140-187`
  has no auth/authorization and takes an enumerable `documentId`. `/api/documents/**` is NOT
  in the proxy matcher. Any actor can pull any finalized PDF/EML (PII). Fix: require an
  authenticated session and verify the document belongs to a matter the caller may access.
- [ ] **A4 CRITICAL — Login lockout not enforced.** `app/api/auth/login/route.ts` increments
  `failedLoginCount` (:117) but never selects/checks it before `bcrypt.compare` → unlimited
  password guessing. Fix: select + check lock fields, reject (429) over threshold.
- [ ] **A5 HIGH — DB TLS verification disabled.** `app/api/auth/login/route.ts:66-69` sets
  `ssl: { rejectUnauthorized: false }` when the URL lacks `sslmode=require` (also repeated
  in many `scripts/*.cjs`). Fix: never disable cert verification; require TLS.
- [ ] **A6 HIGH — Permission-enforcement env flag name mismatch.** `lib/adminPermissions.ts:334`
  checks `BARSH_ADMIN_PERMISSIONS_ENFORCEMENT==="1"`, but the documented activation flag is
  `BARSH_ADMIN_PERMISSIONS_ENFORCEMENT_ENABLED="true"` (:186,:398). An operator turning it on
  per the docs leaves it off. Fix: make checked name == documented name; accept `1`/`true`.
- [ ] **A7 MEDIUM — `lib/prisma.ts:19-21` Pool has no SSL config** (TLS depends entirely on
  the URL). Fix: enforce verified TLS on the main pool.
- [ ] **A8 MEDIUM — Money/Clio-write routes unguarded:** `matters/apply-payment` (post/void
  payment), `graph/create-draft` (gated only by a confirmation string, not auth). Fix: require
  authenticated session.
- [ ] **A9 MEDIUM — `documents/finalize/route.ts:14` imports the auth guard but never calls
  it** (removed in "Phase 45J"). Bounded by env kill-switches, but not authenticated. Fix:
  call the guard (import already present).
- [x] **A10 — No `NEXT_PUBLIC_` secret leakage** (clean; only non-secret app-URL/flag).

## B. Template parity (your priority) — preview vs generation drift

Root cause: the builder preview (`src/lib/templates/template-builder-live-example-preview.ts`)
and the generation resolver (`lib/documents/templateTokenResolver.ts`) are hand-maintained
parallel mappings that have drifted. **Structural fix: have the preview call the generation
resolver so there is one source of truth.** Specific drifts:

- [ ] **B1 CRITICAL — `cost.indexFee/serviceFee/otherCourtCosts` read disjoint keys.** Preview
  reads `*EntryAmount` keys; generation reads plain `indexFee/filingFee/serviceFee/otherCourtCosts/otherCourtFees`.
  Cascades into `cost.total`, `lawsuit.costs`, `lawsuit.balance` (4 wrong tokens).
- [ ] **B2 CRITICAL — `claim.balance` / `claim.payments` source mismatch.** Preview prefers
  `balance_amount`/`payment_amount`; generation reads only `balance_presuit`/`payment_voluntary`.
- [ ] **B3 CRITICAL — `lawsuit.balance` formula differs.** Preview = amount + costs;
  generation = amount + costs − postFilingPayments (generation matches the data model).
- [ ] **B4 CRITICAL — court source/keys differ.** Venue source list differs; `court.street`
  preview reads `addressStreet`, generation reads `addressLine1/street`. Address previews vs
  generates blank.
- [ ] **B5 CRITICAL — insurer/adversary address keys differ.** Preview reads only `hidden_*`;
  generation flattens `_hiddenImportFields` + reads `addressLine1`. (Generation is more
  capable; preview under-resolves.)
- [ ] **B6 HIGH — `claim.*` lawsuit-context gating differs.** Preview blanks claim/billed tokens
  in lawsuit context; generation fills them whenever a claim is found.
- [ ] **B7 HIGH — preview hardcodes signer values** ("Selected Signer", ext "101"); generation
  uses the real signer and always blanks `signer.title`. Also duplicates firm email/fax instead
  of `lib/firmContact.ts`.
- [ ] **B8 MEDIUM — `matter.providerName` normalization differs** (generation normalizes case,
  preview does not).
- [ ] **B9 MEDIUM — silent fallbacks** convert failed reads into empty data in both files,
  contradicting "must not silently blank" — at least distinguish "not found" from "query threw"
  for core claim/lawsuit reads.
- [ ] **B10 LOW — duplicated currency/date/DOS formatters** (preview vs `summons-complaint` vs
  resolver; DOS uses en-dash in two, hyphen in one). Centralize.

## C. Stubbed / incomplete (mostly intentional; one real fix)

- [ ] **C1 — Misleading stale copy.** `app/matters/page.tsx:8125` tells the user finalize/upload
  "will be wired in the backend finalization phase" — but it's already wired and working. Remove/fix.
- [-] **C2 — Template Builder build page is preview-only** (no persist/upload route). Intentional
  per phase plan, but the in-dialog "will be wired" text (`build/page.tsx:441`) is a visible stub.
- [-] **C3 — Settlement document templates are placeholder-seeded** (pipeline real, content not
  production-final). Intentional.
- [-] **C4 — Advanced-search "Matter Stage" picklist** uses a hardcoded fallback (no reference
  table). Low impact.
- [-] **C5 — Admin permission/role system is planning-only**, not enforced (ties to A2/A6).
- [-] **Legacy Clio routes return 410** by design (ADR-0001). Correct, not gaps.

## D. Build / lint / cleanup

- [ ] **D1 — Confirm Vercel build doesn't fail on lint.** ~1,500 ESLint errors (≈97%
  `no-explicit-any`); tsc is clean. `next.config.ts` doesn't set `eslint.ignoreDuringBuilds`.
  Verify whether this Next lints during `next build`; if so, decide: burn down or set the flag.
- [ ] **D2 — Delete 2 committed junk files:** `NEXT_DISABLE_TURBOPACK=1` and
  `clio-lawsuit-aggregator@0.1.0` (both 0 bytes, shell-redirect artifacts).
- [ ] **D3 — Fix `.gitignore`** to match the real `.tmp-*` dirs (current patterns don't).
- [ ] **D4 — 14 unreferenced `lib/` modules** (mostly orphaned legacy-Clio code) — delete after
  a final grep on the user's machine (some may be named in verifier scripts).
- [ ] **D5 — Firm contact duplicated** in `template-signer-requirements-registry-phase1.ts` and
  `summons-complaint/route.ts` — import `BARSH_FIRM_CONTACT` instead. (overlaps B7.)

---

## Recommended order
1. **A0 probe → A1/A3/A2** (close the middleware + the IDOR + add route guards), then A4–A9.
2. **B1–B5 parity** via resolver consolidation (preview calls the generation resolver).
3. **C1 copy fix, D2/D3/D5 cleanup, B7/B8/B10 formatting**, then D4/D1 with confirmation.
