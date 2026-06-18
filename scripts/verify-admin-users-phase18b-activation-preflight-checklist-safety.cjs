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

const sectionStart = page.indexOf('data-barsh-admin-permissions-activation-preflight-checklist="read-only"');
const sectionEnd = page.indexOf('data-barsh-admin-permissions-activation-readiness-json="true"', sectionStart + 1);
const section = sectionStart >= 0 && sectionEnd > sectionStart ? page.slice(sectionStart, sectionEnd) : "";

pass("phase18b_section_present", section.includes("Activation Preflight Checklist"));
pass("phase18b_read_only_claims", section.includes("Read-only checklist") && (section.includes("does not block navigation") || section.includes("do not block navigation")) && section.includes("enable enforcement") && section.includes("write configuration"));
pass("phase18b_check_model_present", page.includes("activationPreflightChecks") && page.includes("activationPreflightPassedCount"));
pass("phase18b_required_checks_present", page.includes("catalog-present") && page.includes("route-mapping-present") && page.includes("role-matrix-present") && page.includes("user-preview-present") && page.includes("selected-user-mismatch-reviewed") && page.includes("runtime-still-read-only"));
pass("phase18b_summary_present", section.includes("data-barsh-admin-permissions-activation-preflight-summary") && section.includes("checks passing"));
pass("phase18b_table_present", section.includes("data-barsh-admin-permissions-activation-preflight-table") && section.includes("data-barsh-admin-permissions-activation-preflight-row"));
pass("phase18b_json_includes_preflight", page.includes("preflightChecks: activationPreflightChecks") && page.includes("preflightPassedCount: activationPreflightPassedCount"));
pass("phase18b_no_write_calls", !section.includes("method: \"POST\"") && !section.includes("method: 'POST'") && !section.includes("/api/admin/users/assign-role") && !section.includes("/api/admin/users/remove-role") && !section.includes("/api/admin/users/permission-override") && !section.includes("/api/admin/users/create") && !section.includes("/api/admin/users/lockout") && !section.includes("/api/admin/users/password-reset"));
pass("phase18b_no_enforcement_flip", !section.includes("setEnforcement") && !section.includes("enableEnforcement") && !section.includes("enforcementEnabled = true"));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 18B activation preflight checklist safety verifier passed");
