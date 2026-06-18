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

const sectionStart = page.indexOf('data-barsh-admin-permissions-activation-design-contract="read-only"');
const sectionEnd = page.indexOf('data-barsh-admin-permissions-activation-readiness-json="true"', sectionStart + 1);
const section = sectionStart >= 0 && sectionEnd > sectionStart ? page.slice(sectionStart, sectionEnd) : "";

pass("phase19a_section_present", section.includes("Phase 19A Activation Design Contract"));
pass("phase19a_read_only_claims", section.includes("Read-only design contract") && section.includes("does not enable runtime enforcement") && section.includes("does not create an activation button") && section.includes("does not write configuration"));
pass("phase19a_contract_model_present", page.includes("activationDesignContract") && page.includes('phase: "19A"') && page.includes('mode: "design-contract-only"'));
pass("phase19a_scope_admin_functions_only", page.includes('proposedFirstScope: "admin-functions-only"') && section.includes("activationDesignContract.proposedFirstScope") && section.includes("First Scope:"));
pass("phase19a_required_decisions_present", page.includes("Confirm admin-functions-only remains the first activation target") && page.includes("Confirm owner_admin must retain all admin functions") && page.includes("Confirm read_only_admin/Jane Doe remains blocked from administrator functions"));
pass("phase19a_rollback_expectation_present", page.includes("same-session rollback path") && page.includes("no-lockout verification"));
pass("phase19a_runtime_no_change", page.includes("runtimeEnforcementChanged: false") && section.includes("Runtime Changed: No"));
pass("phase19a_no_write_calls", !section.includes("method: \"POST\"") && !section.includes("method: 'POST'") && !section.includes("/api/admin/users/assign-role") && !section.includes("/api/admin/users/remove-role") && !section.includes("/api/admin/users/permission-override") && !section.includes("/api/admin/users/create") && !section.includes("/api/admin/users/lockout") && !section.includes("/api/admin/users/password-reset"));
pass("phase19a_no_enforcement_flip", !section.includes("setEnforcement") && !section.includes("enableEnforcement") && !section.includes("enforcementEnabled = true"));
pass("phase19a_readiness_json_includes_contract", page.includes("designContract: activationDesignContract"));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 19A activation design contract safety verifier passed");
