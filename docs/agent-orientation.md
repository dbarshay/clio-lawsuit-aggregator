# Agent Orientation — clio-lawsuit-aggregator

Read this first. It captures the architecture, the non-obvious conventions, and the
gotchas so you don't have to rediscover them every session. Keep it updated when these
facts change.

## What this app is

Next.js (App Router) + TypeScript + Prisma (SQLite locally, Postgres/Neon in prod),
deployed on Vercel. It is **Barsh Matters**, a legal practice tool for a no-fault
firm: it aggregates lawsuits/matters from Clio, manages claims, generates documents
from Word/Excel templates, and tracks admin users/permissions.

Dev server: `npm run dev` (runs with `NEXT_DISABLE_TURBOPACK=1`). App runs at
`http://localhost:3000`. The non-standard Next build is intentional — see `AGENTS.md`.

## Clio is storage-only (critical architecture rule)

- **Clio is used ONLY as a finalized-document repository.** Barsh Matters owns the
  file numbers and lawsuit numbers, not Clio.
- All finalized documents live in **one** Clio matter, "Barsh Matters Master
  Repository" (matterId `1885821245`), inside a folder tree we created.
- Folder taxonomy for a direct matter:
  `Individual Matters / BRL-{rangeStart}-BRL-{rangeEnd} / BRL_YYYYNNNNN`
  (buckets of 1000, e.g. `BRL-202600001-BRL-202600999 / BRL_202600001`).
- Direct matter display-number format is locked to `BRL_YYYYNNNNN`. Inputs like
  `BRL202600001` or `202600001` are normalized to `BRL_YYYYNNNNN`.
- Documents must be openable from the Barsh Matters UI via
  `/api/documents/clio-document-open?documentId=<id>&mode=inline`.
- Env: `CLIO_SINGLE_MASTER_ROOT_FOLDER_ID` (primary). Upload writes are gated behind
  `CLIO_SINGLE_MASTER_UPLOAD_REWIRE_ENABLED`, `CLIO_SINGLE_MASTER_CREATE_FOLDERS_ENABLED`,
  `CLIO_SINGLE_MASTER_LIVE_WRITE_ENABLED`.

### View Documents vs finalize (read-only vs get-or-create)

- **View Documents** (listing) must be **read-only**: resolve the existing folder by
  name with `findExactClioChildFolderByNameWithGuard` + `buildClioStorageTargetPlan`,
  then `listClioFolderDocuments`. It must never create folders and must fail closed.
  Route: `app/api/documents/clio-matter-documents/route.ts`. The direct path sends
  `uploadTargetMode=direct-matter&singleMasterDirectStorage=1&useSingleMasterClioStorage=1&directMatterDisplayNumber=BRL_...`
  and NOT `matterId`/`clioMatterId`.
- **Finalize/upload** is the only place that may get-or-create folders
  (`resolveClioMatterFolderWithGuard`). Route: `app/api/documents/finalize/route.ts`.
  The finalize response returns `uploaded[].clioDocumentId` (and a duplicate-skip path
  with `skipped[].existingClioDocuments[].id`) — it does NOT return an http URL.

## Document generation + delivery flow

UI lives in `app/matter/[id]/page.tsx` (very large file). Wizard stages:
`select → signer → generate → delivery` (`matterDocumentWorkflowStage`).

Delivery actions (all derive the finalized doc via `firstFinalizedClioDocument`, which
reads `uploaded[].clioDocumentId` / duplicate `existingClioDocuments[].id`):

- **Send to Print Queue** → `POST /api/documents/print-queue` with
  `{ masterLawsuitId, confirmAdd: true, directMatterCandidates: [{ clioDocumentId,
  masterMatterId, masterDisplayNumber, filename, label, key }] }`. The route verifies
  the doc in Clio (falls back to `verifyClioDocumentById`) then creates a
  `documentPrintQueueItem`.
- **Print Finalized Document** → loads the PDF in a hidden same-origin iframe and calls
  `contentWindow.print()` to raise the system print dialog (fallback: open in a tab).
- **Save Locally** → `<a download>` of the clio-document-open URL.
- **Email Finalized Document** → opens a recipient popup (`renderMatterEmailDeliveryPopup`):
  To field, prefilled only if a settled-with contact is saved; live-as-you-type search
  (debounced) across settled-with contacts + adversary attorneys; then
  `POST /api/graph/create-draft?confirm=create-graph-draft` with the PDF attached and
  subject `"{Provider} a/a/o {Patient} v. {Insurer}-- {DocLabel}-- {FileNumber}"`.
  Opens the returned `draft.webLink` (Outlook).

## Microsoft Graph email drafts

- `lib/graph/*` (client, token, draft, emailPersistence). `app/api/graph/create-draft/route.ts`
  creates an Outlook draft and attaches the finalized PDF (downloaded from Clio by
  `clioDocumentId`).
- Requires Graph env (`assertGraphDraftEnvironmentReady`).
- `buildGraphDraftPayloadPreview().validation.readyForGraphDraftCreate` requires a To
  recipient, EXCEPT for finalized-PDF-delivery sources, which bypass it. Sources:
  `settlement_finalized_pdf_delivery` and `direct_matter_finalized_pdf_delivery`
  (combined flag `finalizedPdfDelivery`).

## Reference data (multiple tables)

- `SettlementContact` table → `/api/settlements/contacts?q=` (name/email/company/role).
- Reference entity contacts → `/api/reference-data/contact-search?q=&type=` where type
  normalizes to `individual`, `insurer_company`, `adversary_attorney`
  (see `/api/reference-data/options/route.ts` for the alias map).
- Seed scripts: `seed-settled-with-reference-contacts`, `seed-adversary-attorneys-reference`,
  `seed-transaction-reference-options`.

## Provider/client name case

- Stored names are often ALL CAPS. Normalize for display with
  `lib/providerNameCase.ts` → `normalizeProviderName` (handles P.C., PLLC, M.D., MRI,
  d/b/a, small words, initials). Applied to the matter provider card and the email
  subject. Do NOT normalize the value used in `/matters?provider=` href filters.
- Stored-data normalization: `npm run normalize:provider-client-display-names`
  (writes the reference DB, preserves originals as aliases). Keep its rules in sync
  with `lib/providerNameCase.ts`.

## UI conventions

- Standard Barsh Matters button = blue `#1e3a8a` background, white text, weight 950.
  Close/Cancel/Back are neutral (gray/white) or red (destructive). Fix off-spec buttons
  (green/outlined) to the blue standard.
- The app opts out of browser translation in `app/layout.tsx`
  (`translate="no"` + `notranslate` + `<meta name="google" content="notranslate">`).
  Reason: Google Translate wraps text nodes in `<font>` and breaks React text updates
  (symptom: frozen/stale UI values like a "Documents: 0" counter). Do not remove.

## Gotchas / workflow

- **Do not run `npm run build`** unless necessary. Use `npx tsc --noEmit` for type
  checks and the targeted `scripts/verify-*.mjs/.cjs` verifiers.
- **Do not `node --check` a `.ts` file** (Node errors on the extension). Use tsc / tsx.
- Commits and DB-writing scripts must be run from the user's machine (the sandbox can't
  write to `.git` — a stale `.git/index.lock` recurs — and can't reach Neon). Hand the
  user a copy/paste block: `cd ~/clio-lawsuit-aggregator`, remove the lock, add, commit.
  Quote `'app/matter/[id]/page.tsx'` (zsh globs the `[id]`).
- Work historically proceeded in tightly-scoped numbered "phases" with docs in `docs/`.
- Locked: document header/letterhead formatting. Don't reintroduce legacy per-direct-matter
  Clio matter lookups into the read-only View Documents path.
