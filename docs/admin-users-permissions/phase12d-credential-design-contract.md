# Admin Users / Permissions Phase 12D Credential Design Contract

Phase 12D is verifier-only. It records the username/password credential design contract and must not implement schema fields, migrations, password hashing, credential bootstrap, login behavior changes, session identity binding, permission enforcement, or limited-user enforcement.

Locked decisions:
- Username mode: separate username only, not email-as-username.
- Username convention: first initial + last name.
- Example: Jane Doe = JDoe.
- Owner email: dbarshay15@gmail.com.
- Owner username: dbarshay.
- Jane Doe email: jane.doe.limited@example.com.
- Jane Doe planned username: JDoe.
- Jane Doe role: read_only_admin.
- Jane Doe is not owner_admin and not bootstrapSafe.
- Jane Doe may receive credentials later, but must not become an enforceable limited login in Phase 12D.
- Password setup method: owner bootstrap first, UI-managed/admin-managed passwords later.
- Owner bootstrap means a controlled verifier-backed non-UI way to seed or repair owner credentials before the username/password login UI is trusted.
- Password policy: minimum 10 characters, at least one uppercase letter, one lowercase letter, one number, and one symbol.
- Password change on first login: required once the password-change flow exists.
- Legacy BARSH_ADMIN_PASSWORD fallback remains available until a later manual removal decision.
- Failed-login behavior: log failed attempts only for now. No lockout now.
- 2FA: reserve and plan for two-factor authentication, but do not implement now.
- Usernames should be editable later in Admin Users UI.
- Because usernames may be editable, authorization and audit-sensitive identity must bind to immutable AdminUser.id, not username.
- Usernames must be globally unique case-insensitively.
- Email uniqueness remains preserved.
- Password hashing choice: bcryptjs.
- Phase 12D records bcryptjs as the future choice only. Phase 12D must not install bcryptjs, add passwordHash, or hash any password.
- Owner recovery/bootstrap path is required before legacy fallback removal is considered.

Never-block routes that must remain reachable for owner/admin:
- /admin
- /admin/permissions
- /api/admin/permissions
- /api/admin/permissions/check

Staged rollout:
- Phase 12D: verifier-only credential design contract.
- Phase 12E: schema fields and migration only; no login behavior change.
- Phase 12F: owner credential bootstrap package/verifier; no enforcement change.
- Phase 12G: login UI accepts username/password while legacy fallback remains.
- Phase 12H: prove owner session identity binding to AdminUser.id.
- Later: Jane Doe credential test and limited-permission enforcement planning only after owner identity binding is proven.
