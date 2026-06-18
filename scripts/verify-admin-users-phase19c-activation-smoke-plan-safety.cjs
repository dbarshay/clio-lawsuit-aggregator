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

const sectionStart = page.indexOf('data-barsh-admin-permissions-activation-smoke-plan="read-only"');
const sectionEnd = page.indexOf('data-barsh-admin-permissions-activation-readiness-json="true"', sectionStart + 1);
const section = sectionStart >= 0 && sectionEnd > sectionStart ? page.slice(sectionStart, sectionEnd) : "";

pass("phase19c_section_present", section.includes("Phase 19C Activation Smoke-Test Plan"));
pass("phase19c_read_only_claims", section.includes("Read-only smoke-test plan") && section.includes("does not create an executable activation script") && section.includes("enable enforcement") && section.includes("call write routes"));
pass("phase19c_plan_model_present", page.includes("activationSmokePlan") && page.includes('phase: "19C"') && page.includes('mode: "smoke-plan-only"'));
pass("phase19c_owner_no_lockout_required", page.includes("owner_admin") && page.includes("Smoke must prove owner_admin is not locked out") && section.includes("Owner No-Lockout: Required"));
pass("phase19c_readonly_scope_limited", page.includes("read_only_admin") && page.includes("administrator-function blocking is limited") && section.includes("Admin Functions Only"));
pass("phase19c_rollback_required", page.includes("rollback can be applied in the same session before push") && section.includes("Rollback Before Push: Required"));
pass("phase19c_no_impersonation", page.includes("Smoke must not require password visibility, impersonation, or access-as another user"));
pass("phase19c_forbidden_mutations_present", page.includes("No executable activation script") && page.includes("No runtime enforcement change") && page.includes("No write route invocation"));
pass("phase19c_runtime_no_change", page.includes("runtimeEnforcementChanged: false"));
pass("phase19c_no_write_calls", !section.includes("method: \"POST\"") && !section.includes("method: 'POST'") && !section.includes("/api/admin/users/assign-role") && !section.includes("/api/admin/users/remove-role") && !section.includes("/api/admin/users/permission-override") && !section.includes("/api/admin/users/create") && !section.includes("/api/admin/users/lockout") && !section.includes("/api/admin/users/password-reset"));
pass("phase19c_no_enforcement_flip", !section.includes("setEnforcement") && !section.includes("enableEnforcement") && !section.includes("enforcementEnabled = true"));
pass("phase19c_readiness_json_includes_plan", page.includes("smokePlan: activationSmokePlan"));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 19C activation smoke-test plan safety verifier passed");
