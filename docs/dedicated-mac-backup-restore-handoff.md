# Barsh Matters Dedicated Mac Backup / Restore / Handoff Plan

## Purpose

Barsh Matters is currently being developed and tested on a local working machine. A different dedicated Mac will ultimately run Barsh Matters in production with both disk backup and cloud backup.

All operational configuration must be transferable to the dedicated Mac. Machine-specific paths, local secrets, backup outputs, and Dropbox sync paths must not be treated as portable merely because they work on the current machine.

## Recovery model

Barsh Matters has three separate recovery sources:

1. GitHub stores the application code.
2. PostgreSQL-native backup stores the local Barsh Matters database.
3. Clio stores actual matter/lawsuit documents.

The PostgreSQL backup is expected to restore local Barsh Matters data, including ClaimIndex, lawsuits, payment records, settlement records, ticklers, audit/history, reference data, email/maildrop metadata, document-template rows, and local document workflow metadata.

Actual document files, scanned documents, generated final PDFs stored in Clio, and Clio document folders are intentionally excluded from the Barsh Matters database backup because Clio is the document vault.

## Do not commit

Do not commit:

- .env
- .env.local
- local Dropbox paths
- backups/indexes/CLOUD_TARGET.txt
- backups/indexes/LATEST_BACKUP.txt
- backups/indexes/backup-alert-state.json
- backup folders
- database.dump
- schema.sql
- archive-list.txt
- backup logs
- secrets or access tokens

The repository may track example files, scripts, verifiers, and this checklist.

## Dedicated Mac setup checklist

1. Install Git, Node/npm, PostgreSQL command-line tools, Dropbox, and Time Machine or another disk backup target.
2. Clone the repository from GitHub.
3. Run npm install.
4. Restore or recreate the dedicated Mac environment file.
5. Confirm pg_dump and pg_restore are available, or set PG_DUMP_BIN and PG_RESTORE_BIN.
6. Install Dropbox and confirm the actual local Dropbox path on that Mac.
7. Create backups/indexes/CLOUD_TARGET.txt on that Mac only, pointing to the local Dropbox sync folder.
8. Run npm run backup:indexes.
9. Confirm the local backup and Dropbox mirror both contain manifest.json, database.dump, schema.sql, and archive-list.txt.
10. Run npm run verify:admin-backup-prisma-model-archive-coverage.
11. Run npm run verify:dropbox-backup-mirror-safety.
12. Run npm run verify:dedicated-mac-backup-readiness.
13. Configure scheduled monitored backups.
14. Confirm Admin Backup / Restore shows recent backup health.
15. Configure disk backup to include the repo, local backup folder, environment/secrets location, and machine-specific configuration.
16. Perform a restore-preview drill.
17. Before staff deployment, perform a guarded restore drill into a non-production database.

## Dropbox configuration rule

Dropbox cloud makes the backup portable, but the running machine still needs a local Dropbox sync path configured correctly.

CLOUD_TARGET.txt is machine-specific and should remain untracked.

Preferred model:

- Git tracks backup scripts, restore scripts, verifiers, and documentation.
- Each machine has its own untracked CLOUD_TARGET.txt.
- Dropbox stores mirrored backup outputs.
- Time Machine or another disk backup protects machine-specific configuration and local copies.

## Restore preview

Before any restore, run:

    npm run restore:indexes-preview -- /path/to/backup-folder

The preview is read-only and must be reviewed before any guarded restore.

## Guarded restore

Only after confirming the target database and backup folder:

    CONFIRM_RESTORE=YES_RESTORE_LOCAL_POSTGRES_DATABASE npm run restore:indexes-postgres-guarded -- /path/to/backup-folder

Never run guarded restore against production unless:

1. the target database is confirmed,
2. the selected backup folder is confirmed,
3. restore preview has been run,
4. staff is out of the app,
5. a fresh backup has been made if possible,
6. the app will be restarted after restore.

## Total failure recovery

If the dedicated Mac is lost:

1. Replace Mac.
2. Install Git, Node, PostgreSQL tools, and Dropbox.
3. Clone repo.
4. Restore environment secrets.
5. Locate latest Dropbox backup folder.
6. Run restore preview.
7. Run guarded PostgreSQL restore.
8. Restart Barsh Matters.
9. Run backup/archive coverage verifiers.
10. Confirm Clio document access.

## Final production recovery model

Local PostgreSQL database is backed up every 15 minutes, copied to Dropbox, and also protected by disk backup.

Documents remain in Clio.

Repo/code is recoverable from GitHub.

Secrets/env must be backed up separately and securely.
