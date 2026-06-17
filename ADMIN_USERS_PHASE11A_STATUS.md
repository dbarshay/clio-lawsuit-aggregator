# Admin Users Phase 11A Status

## Result

Phase 11A is locked as a production UI-created limited test user package.

## Jane Doe production UI result

Jane Doe was created through the production Admin Users UI and assigned the read-only admin role.

- Display name: Jane Doe
- Email: jane.doe.limited@example.com
- Status: active
- Role assigned through UI: read_only_admin — Read-Only Admin
- Role permission count shown in preview: 14
- owner_admin: false
- bootstrapSafe: false
- Owner/admin actor used for guarded write: dbarshay15@gmail.com

## Safety findings

- dbarshay15@gmail.com remains the protected owner_admin/bootstrapSafe user.
- Owner/admin lockout protection was preserved during role-assignment preview.
- The role-assignment route did not change the permission-enforcement setting.
- The old UI success copy “Permission enforcement remains disabled” was stale/ambiguous and should read: “Permission enforcement setting was not changed.”
- Never-block permission routes remain protected by existing lockout verifiers:
  - /admin
  - /admin/permissions
  - /api/admin/permissions
  - /api/admin/permissions/check

## Important limitation

Jane Doe is now a real AdminUser/role assignment record created through the production UI. However, this is not yet a real separate-user login/enforcement proof.

The current auth/session path remains generic admin-session based and is not yet wired to bind a browser session to an individual AdminUser.email. Therefore, Jane Doe cannot yet be used for a true limited-user browser smoke until per-user auth/session identity is implemented.

## Next step

Phase 12 should implement real per-user auth/session identity so Jane Doe can log in as Jane Doe and browser/API enforcement can be tested against her read_only_admin effective permissions.
