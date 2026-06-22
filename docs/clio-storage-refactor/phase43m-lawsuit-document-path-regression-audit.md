# Phase 43M — Lawsuit Document Path Regression Audit

Phase 43M audits the existing lawsuit/master document flow after the direct/individual UI dry-run work.

This phase is static/read-only. It does not change app behavior, does not start a server, does not call Clio, and does not upload anything.

Regression contract:

- lawsuit/master document UI still uses `masterLawsuitId`;
- lawsuit/master document UI still uses `uploadTargetMode: "master-lawsuit"` where applicable;
- lawsuit/master working-DOCX creation still posts to `/api/documents/working-docx`;
- lawsuit/master finalization still posts to `/api/documents/finalize`;
- lawsuit/master paths must remain distinct from direct/individual paths;
- direct/individual folder segments must not be used inside master/lawsuit helper blocks;
- lawsuit storage taxonomy remains `Lawsuits / YYYY-MM / YYYY.MM.NNNNN`;
- direct storage taxonomy remains `Individual Matters / BRL-YYYY00001-BRL-YYYY00999 / BRL_YYYYNNNNN`;
- no live upload is enabled;
- no document is uploaded.
