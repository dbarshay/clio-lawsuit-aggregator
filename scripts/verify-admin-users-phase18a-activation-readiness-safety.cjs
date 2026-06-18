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

const sectionStart = page.indexOf('data-barsh-admin-permissions-activation-readiness="read-only"');
const sectionEnd = page.indexOf('data-barsh-admin-permissions-user-effective-preview="read-only"');
const section = sectionStart >= 0 && sectionEnd > sectionStart ? page.slice(sectionStart, sectionEnd) : "";

pass("phase18a_section_present", section.includes("Phase 18A Permission Activation Readiness"));
pass("phase18a_read_only_claims", section.includes("Read-only readiness dashboard") && section.includes("does not enable enforcement") && section.includes("does not") && section.includes("modify records"));
pass("phase18a_runtime_flag_no_change", section.includes("Runtime Enforcement Changed:</strong> No") && section.includes("runtimeEnforcementChanged: false"));
pass("phase18a_counts_present", section.includes("data-barsh-admin-permissions-activation-catalog-count") && section.includes("data-barsh-admin-permissions-activation-route-count") && section.includes("data-barsh-admin-permissions-activation-matrix-count") && section.includes("data-barsh-admin-permissions-activation-user-count"));
pass("phase18a_status_present", section.includes("data-barsh-admin-permissions-activation-status") && section.includes("READY FOR REVIEW") && section.includes("REVIEW WARNINGS"));
pass("phase18a_json_preview", section.includes("data-barsh-admin-permissions-activation-readiness-json") && section.includes("activationReadinessWarnings"));
pass("phase18a_uses_existing_read_models", page.includes("activationCatalogCount") && page.includes("activationRouteMappingCount") && page.includes("activationRoleMatrixCount") && page.includes("activationUserPreviewCount"));
pass("phase18a_no_write_calls", !section.includes("method: \"POST\"") && !section.includes("method: 'POST'") && !section.includes("/api/admin/users/assign-role") && !section.includes("/api/admin/users/remove-role") && !section.includes("/api/admin/users/permission-override") && !section.includes("/api/admin/users/create") && !section.includes("/api/admin/users/lockout") && !section.includes("/api/admin/users/password-reset"));
pass("phase18a_no_enforcement_flip", !section.includes("setEnforcement") && !section.includes("enableEnforcement") && !section.includes("enforcementEnabled = true"));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 18A activation readiness safety verifier passed");
