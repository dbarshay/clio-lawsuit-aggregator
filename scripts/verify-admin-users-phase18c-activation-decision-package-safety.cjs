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

const sectionStart = page.indexOf('data-barsh-admin-permissions-activation-decision-package="read-only"');
const sectionEnd = page.indexOf('data-barsh-admin-permissions-activation-readiness-json="true"', sectionStart + 1);
const section = sectionStart >= 0 && sectionEnd > sectionStart ? page.slice(sectionStart, sectionEnd) : "";

pass("phase18c_section_present", section.includes("Activation Decision Package"));
pass("phase18c_read_only_claims", section.includes("Read-only go/no-go summary") && section.includes("does not create an activation button") && section.includes("does not enable enforcement") && section.includes("does not modify users"));
pass("phase18c_package_model_present", page.includes("activationDecisionPackage") && page.includes('proposedScope: "admin-functions-only"') && page.includes("nextHumanDecision"));
pass("phase18c_status_tiles_present", section.includes("data-barsh-admin-permissions-activation-decision-scope") && section.includes("data-barsh-admin-permissions-activation-decision-enforcement") && section.includes("data-barsh-admin-permissions-activation-decision-preflight") && section.includes("data-barsh-admin-permissions-activation-decision-warning-count"));
pass("phase18c_json_preview", section.includes("data-barsh-admin-permissions-activation-decision-json") && section.includes("activationDecisionPackage"));
pass("phase18c_no_write_calls", !section.includes("method: \"POST\"") && !section.includes("method: 'POST'") && !section.includes("/api/admin/users/assign-role") && !section.includes("/api/admin/users/remove-role") && !section.includes("/api/admin/users/permission-override") && !section.includes("/api/admin/users/create") && !section.includes("/api/admin/users/lockout") && !section.includes("/api/admin/users/password-reset"));
pass("phase18c_no_enforcement_flip", page.includes("runtimeEnforcementChanged: false") && page.includes("enforcementCurrentlyEnabled: Boolean(data?.enforcementEnabled)") && section.includes("activationDecisionPackage.enforcementCurrentlyEnabled") && section.includes("JSON.stringify(activationDecisionPackage") && !section.includes("setEnforcement") && !section.includes("enableEnforcement") && !section.includes("enforcementEnabled = true") && !section.includes("enforcementCurrentlyEnabled: true"));
pass("phase18c_readiness_json_includes_package", page.includes("decisionPackage: activationDecisionPackage"));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 18C activation decision package safety verifier passed");
