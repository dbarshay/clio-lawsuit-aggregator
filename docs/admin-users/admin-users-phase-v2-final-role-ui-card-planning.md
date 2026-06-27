# Admin Users Phase V2 — Final Role UI and Administrator Card Planning

## Status

Read-model and UI planning only. This phase does not save Administrator card grants, does not migrate DB role seeds, does not activate runtime permission enforcement, and does not change current user access behavior.

## What changed

- `/api/admin/users/planning` now exposes the Phase V1 final five-role model under `finalRoleModel`.
- The Admin Users edit role picklists prefer the final five roles:
  - Owner / `owner_admin`
  - Administrator / `administrator`
  - Full User / `full_user`
  - Basic User / `basic_user`
  - View Only / `view_only`
- The Users summary shows final-role and admin-card counts.
- Editing an Administrator or assigning Administrator shows a read-only Admin-card planning checkbox panel.
- Editing an Owner or assigning Owner shows the same card panel in owner-all-cards mode.

## Non-activation guarantees

- Runtime permission enforcement remains unchanged.
- Session behavior remains unchanged.
- Card checkboxes are read-only and disabled.
- No card grant POST/PATCH/PUT/DELETE route is introduced.
- Existing owner no-lockout and 2FA setup verification safeguards remain verifier-covered.

## Next phase

Phase V3 should add a DB seed/update path for the final role records and should preserve `owner_admin` as the internal Owner compatibility key.
