# Admin Users Phase 14C Owner/Jane Manual Smoke Proof

Date: 2026-06-18

## Scope

Manual browser smoke proof for first real admin-function enforcement target.

Rule tested:

- Owner/admin retains admin access.
- Jane Doe / read_only_admin has access to regular non-admin application pages.
- Jane Doe is blocked from administrator pages and administrator API functions.
- Passwords are not exposed.
- Login impersonation is not available.
- Enforcement scope remains limited to administrator functions.

## Manual Smoke Results

### Owner

Result: PASS.

Observed:

- Owner login succeeded with username/password.
- Owner could access admin functions.
- Owner/admin access was not blocked by the Phase 14A admin-function proxy.

### Jane Doe

Result: PASS.

Observed:

- Jane Doe login succeeded as JDoe.
- Jane Doe could access regular non-admin application pages.
- Jane Doe was blocked from administrator API functions.

Observed administrator API block response:

```json
{
  "ok": false,
  "action": "admin-enforcement-phase14a",
  "blocked": true,
  "error": "Administrator functions are restricted to owner_admin.",
  "permissionEnforcementScope": "admin-functions-only"
}
```

Confirmed manually:

- Jane Doe could access non-admin routes.
- Jane Doe could not access admin API routes.
- Admin block scope was admin-functions-only.

## Conclusion

PASS: Phase 14C owner/Jane manual smoke passed.

The implemented rule matches the current business decision: Jane Doe should have access to everything except admin functions.
