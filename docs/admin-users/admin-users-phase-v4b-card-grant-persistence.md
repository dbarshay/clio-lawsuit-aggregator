# Admin Users Phase V4B - Administrator Card Grant Persistence

Status: guarded persistence route and read model only.

This phase adds `/api/admin/users/card-grants`.

The route saves Administrator Admin-card grants as `AdminUserPermissionOverride` rows with `action = allow`.

Safety guarantees:

- Only an active owner_admin actor can preview/apply card-grant changes.
- Target user must be active.
- Target user must have the `administrator` role.
- Owner users are blocked because Owner receives all Admin cards through `owner_admin`.
- Unknown Admin-card grant keys are rejected.
- Existing legacy roles are not deleted or deactivated.
- Runtime permission enforcement remains disabled.
- Session behavior is unchanged.
- No user rows are created or deleted.
- No user role assignments are changed.
- Audit logging records apply operations.

Next phase: wire the Admin Users edit panel checkboxes to call this route in preview/apply mode.
