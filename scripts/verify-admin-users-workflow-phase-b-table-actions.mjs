import fs from "node:fs";
const page = fs.readFileSync("app/admin/users/page.tsx", "utf8");
const api = fs.readFileSync("app/api/admin/users/planning/route.ts", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };
for (const token of ["data-barsh-admin-users-table","Display Name","User Name","Role","Last Sign-in","data-barsh-admin-users-create-top-button","data-barsh-admin-users-edit-row-button","data-barsh-admin-users-reset-password-row-button","data-barsh-admin-users-activate-2fa-row-button","data-barsh-admin-users-2fa-enforced-label","data-barsh-admin-users-lock-row-button","data-barsh-admin-users-signout-row-button","data-barsh-admin-users-role-assign-row-button","data-barsh-admin-users-role-remove-row-button"]) must(page.includes(token), "missing table/action token: " + token);
for (const removed of ["data-barsh-admin-users-lockout-card","data-barsh-admin-users-assign-role-control","data-barsh-admin-users-remove-role-control","data-barsh-admin-users-permission-override-control","data-barsh-admin-users-write-controls-preview","data-barsh-admin-users-planning-users","data-barsh-admin-users-planning-roles"]) must(!page.includes(removed), "removed panel still present: " + removed);
for (const route of ["/api/admin/users/signer-profile","/api/admin/users/password-reset","/api/admin/users/lockout","/api/auth/signout","/api/admin/users/assign-role","/api/admin/users/remove-role"]) must(page.includes(route), "row action missing route: " + route);
must(api.includes("lastLoginAt: user.lastLoginAt"), "planning API must expose lastLoginAt");
for (const forbiddenOverride of ["overridePreviewReady","overrideResult","overrideTargetEmail","overridePermissionKey","overrideAction","overrideReason","overrideActorEmail","setOverride","submitPermissionOverride","/api/admin/users/permission-override"]) must(!page.includes(forbiddenOverride), "Permission Override leftover must not remain in Users landing: " + forbiddenOverride);
for (const forbidden of ["graphFetchJson","sendMail(","legacyClioOperationalRouteBlocked","DocumentTemplate"]) must(!page.includes(forbidden), "forbidden workflow token present: " + forbidden);
must(pkg.scripts?.["verify:admin-users-workflow-phase-b-table-actions"] === "node scripts/verify-admin-users-workflow-phase-b-table-actions.mjs", "package script missing");
if (failures.length) { console.error("FAIL: Admin Users Workflow Phase B verifier failed"); for (const failure of failures) console.error(" - " + failure); process.exit(1); }
console.log("PASS: Admin Users Workflow Phase B table-first action UI locked.");
