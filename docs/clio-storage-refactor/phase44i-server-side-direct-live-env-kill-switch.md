# Phase 44I — Server-Side Direct Live Finalize Env Kill Switch

## Purpose

Phase 44I adds a server-side environment kill switch for direct-matter live finalize requests.

Phase 44D hid the direct live finalize UI unless:

`NEXT_PUBLIC_BARSH_DIRECT_MATTER_CLIO_LIVE_FINALIZE_ENABLED=1`

Phase 44I hardens the server route so the direct-matter live finalize path is also rejected unless the server environment explicitly enables:

`BARSH_DIRECT_MATTER_CLIO_LIVE_FINALIZE_ENABLED=1`

## Contract

The existing route-level `isDirectMatterLiveFinalizeRequest` boolean remains the canonical direct-live detector and must continue to require:

- `uploadTargetMode === "direct-matter"`
- `confirmUpload === true`
- `singleMasterDryRun !== true`

When that boolean is true, the route must reject the request unless:

`String(process.env.BARSH_DIRECT_MATTER_CLIO_LIVE_FINALIZE_ENABLED || "").trim() === "1"`

The existing Phase 44C admin authorization guard remains required even when the server env flag is enabled.

## Safety

Phase 44I does not set any environment variable.

Phase 44I does not expose a live UI button.

Phase 44I does not run a live smoke.

Phase 44I does not upload a document.

The direct/individual matter payload must remain separate from lawsuit/master document finalize payloads and must not include `masterLawsuitId`.

## Expected guard order

The direct-live detector must appear before the server-side env kill switch.

The server-side env kill switch must appear before the existing Phase 44C admin authorization guard.

Both guards must appear before the upload helper call.

## Storage rules preserved

- Clio is storage only.
- Barsh Matters owns and assigns file numbers and lawsuit numbers.
- Direct/individual matters use `BRL_YYYYNNNNN`.
- Lawsuits use `YYYY.MM.NNNNN`.
- Direct documents remain under Individual Matters and are not automatically moved if later aggregated into a lawsuit.
- No patient/provider/insurer/claim/denial facts appear in Clio folder names.
