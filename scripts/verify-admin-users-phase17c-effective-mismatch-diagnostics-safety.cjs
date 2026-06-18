const fs = require("fs");
const page = fs.readFileSync("app/admin/permissions/page.tsx", "utf8");

function pass(name, ok) {
  if (!ok) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${name}`);
  }
}

const sectionStart = page.indexOf('data-barsh-admin-permissions-user-effective-mismatch-diagnostics="read-only"');
const sectionEnd = page.indexOf('data-barsh-admin-permissions-user-effective-json="true"', sectionStart + 1);
const section = sectionStart >= 0 && sectionEnd > sectionStart ? page.slice(sectionStart, sectionEnd) : "";

pass("phase17c_section_present", section.includes("Effective Permission Mismatch Diagnostics"));
pass("phase17c_read_only_claims", section.includes("Read-only diagnostic") && section.includes("informational only"));
pass("phase17c_effective_keys_used", page.includes("selectedUserEffectiveKeys") && page.includes("effectivePermissionKeys"));
pass("phase17c_matrix_allowed_keys_used", page.includes("selectedUserMatrixAllowedKeys") && page.includes("selectedUserPermissionRows"));
pass("phase17c_mismatch_lists_used", page.includes("selectedUserEffectiveOnlyKeys") && page.includes("selectedUserMatrixOnlyKeys") && page.includes("selectedUserMismatchCount"));
pass("phase17c_count_display", section.includes("data-barsh-admin-permissions-user-effective-mismatch-count") && section.includes("Mismatch Count:"));
pass("phase17c_json_preview", section.includes("data-barsh-admin-permissions-user-effective-mismatch-json") && section.includes("runtimeEnforcementChanged: false"));
pass("phase17c_no_user_write_calls", !section.includes("/api/admin/users/assign-role") && !section.includes("/api/admin/users/remove-role") && !section.includes("/api/admin/users/permission-override") && !section.includes("/api/admin/users/create") && !section.includes("/api/admin/users/lockout") && !section.includes("/api/admin/users/password-reset") && !section.includes("method: \"POST\"") && !section.includes("method: 'POST'"));
pass("phase17c_no_enforcement_flip", !section.includes("setEnforcement") && !section.includes("enableEnforcement") && section.includes("runtimeEnforcementChanged: false"));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 17C effective-permission mismatch diagnostics safety verifier passed");
