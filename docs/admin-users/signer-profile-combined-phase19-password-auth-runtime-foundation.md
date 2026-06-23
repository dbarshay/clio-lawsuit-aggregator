# Admin Users / Signer Profile Combined Phase 19 — Password Auth Runtime Foundation

## Baseline

- Phase 18 lock: `admin-users-phase18-exact-forced-password-change-patch-targets-20260623`.
- Runtime mutation: `true`.

## Runtime additions

- Added shared password-auth runtime helper: `src/lib/auth/admin-user-password-auth-runtime-phase19.ts`.
- Added forced password-change API route: `app/api/auth/forced-password-change/route.ts`.
- Added current-user change-password API route: `app/api/auth/change-password/route.ts`.
- Added forced password-change page: `app/forced-password-change/page.tsx`.
- Added current-user change-password page: `app/change-password/page.tsx`.
- Added non-invasive Phase 19 markers to the selected login route, login page, and session route identified by Phase 18.

## Safety limits

- Does not change password-reset generated temporary password behavior.
- Does not change signer-profile route.
- Does not change 2FA behavior.
- Does not change document-generation behavior.
- Does not change DOCX templates.
- Deeper login/session lockout rewriting remains deferred until the next combined session/auth phase because the selected login/session logic should not be rewritten blindly.

