# Verifier baseline — 2026-06-29

Snapshot of the `scripts/verify-*.{mjs,cjs}` suite after the template-builder preview
consolidation, firm-contact dedup, and Step-2 copy fixes.

## Headline

- **758** verifier scripts total.
- **558 pass / 200 fail.**
- The deploy gate (`tsc --noEmit` + Vercel build) is **green**. None of these 200 failures
  block the running app; they are source-text "proof" scripts that grep files for expected
  strings, and most have drifted as the code evolved.

Everything changed in this session's work is green: template-builder generation-parity,
firm-signer contact (3 verifiers), Step-2 copy, phase1l/1o, verifier contract-locks.

## What the 200 failures actually are

These are **not** runtime/behavioral failures. They are predominantly historical
**snapshot proofs**: each was written to freeze the code at one development phase and assert
specific literal fragments. When later work refactored that code, the snapshot goes red
without indicating any real defect. 152 of the 200 are named `*-safety`; 95 are `phaseNN`
phase-progression snapshots.

### Buckets (with how each should be handled)

1. **Historical phase scaffolding (~95)** — `*-completion-safety`, `*-readiness-safety`,
   `*-planning-*-safety`, `clio-storage-refactor-phaseNN-*`, etc. Each documents that a past
   development phase was planned/completed. For features already shipped, these are
   superseded. *Mostly retire — but verify per item, because a few "completion" proofs
   assert the final shipped feature still exists and remain valuable.*

2. **UI / page / copy snapshots (~38)** — header layout, document-template dialog UI,
   template-builder UI polish, settlement dialog copy, etc. They grep the page for literal
   copy/markup that has since been reworded or restructured. *Reconcile to current truthful
   copy, or retire if the UI element is gone.*

3. **Superseded config-contract checks (~7)** — read `.env.local` and assert the OLD Clio
   storage variables (`CLIO_STORAGE_MODE`, `CLIO_MASTER_MATTER_ID`, `CLIO_BUCKET_SIZE=1000`).
   The app has since moved to the `CLIO_SINGLE_MASTER_*` scheme actually present in
   `.env.local`. *Reconcile: update the expected variable names; keep the still-true
   master-matter-ID / name / ADR assertions.* (`CLIO_BUCKET_SIZE` is the folder-tree
   bucketing — a real persistence concept, just renamed.)

4. **Live-smoke / network checks (~12–16)** — hit the deployed Vercel app or live Clio/Graph
   APIs (one still uses the pre-rename `clio-lawsuit-aggregator.vercel.app` URL). They cannot
   run from the sandbox regardless of `.env`. *Keep — run on a machine with network; fix the
   stale URL to the renamed deployment.*

5. **Security / RBAC / persistence guards (~50, interwoven)** — admin-users phases
   (inactivity timeout, password reset, forced password change, credential bootstrap),
   permission enforcement, finalize-route auth, Clio single-master storage/finalization.
   Spot-checks so far show the *enforcement is intact* and the proofs grep for prior syntax
   (e.g. `!isAdminRequestAuthorized(req as any)` vs the current `isAdminRequestAuthorized(req)`,
   or `adminUnauthorizedJson(401)` vs the current fail-closed helper). *Handle individually
   and carefully — never auto-retire; reconcile to current truthful code or fix any real gap.*

## Spot-check evidence (no real regressions found)

- `proxy.ts` is **fail-closed, owner-only** on every `/admin` and `/api/admin` surface
  (live-verified earlier). The two `admin-auth-foundation` / `permission-enforcement-engine`
  proofs assert the previous middleware's exact fragments; security is at least as strict.
- `app/api/documents/finalize/route.ts` **has** the admin guard
  (`if (!isAdminRequestAuthorized(req)) return adminUnauthorizedJson();`); the phase44 proofs
  grep for an `as any` cast the cleaner code doesn't need.
- `phase12j-lockout-controls` checks for a lockout *UI card*; the lockout *enforcement*
  lives (and works) in the login route.
- The `CLIO_*` env proofs fail because the var scheme was renamed, not because `.env` is
  absent (it is present and readable).

## Recommendation

Mechanical "retire all 200" would delete real env/network/security/persistence guardrails and
is not advised. The safe, high-value path is **careful, reviewable, incremental** work:

1. Retire only individually-confirmed superseded historical scaffolding.
2. Reconcile UI/copy and config-contract drift to current truthful values.
3. Keep network smokes (fix the stale deployment URL) and run them on a networked machine.
4. Handle every security/persistence proof by hand — reconcile or fix, never bulk-delete.

Because each item needs individual judgment and several naming conventions overlap across
security/persistence/UI, this is done in bounded batches with per-item evidence rather than a
single automated sweep.
