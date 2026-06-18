const fs = require("fs");
const proof = JSON.parse(fs.readFileSync("docs/implementation/admin-users-phase23-final-production-manual-smoke-proof.json", "utf8"));
function pass(name, ok) {
  if (!ok) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${name}`);
  }
}
pass("phase23_final_proof_present", proof.phase === "23-final-production-manual-smoke-proof");
pass("phase23_enforcement_live", proof.status?.enforcementEnabled === true && proof.activationStatus === "live-enforcement-on");
pass("phase23_ready_for_activation", proof.status?.readyForActivation === true);
pass("phase23_scope_admin_functions_only", proof.scope === "admin-functions-only" && proof.status?.scope === "admin-functions-only");
pass("phase23_no_missing_blocks", Array.isArray(proof.status?.missingRequiredBlocks) && proof.status.missingRequiredBlocks.length === 0);
pass("phase23_manual_smoke_confirmed", proof.manualSmokeConfirmedByUser === true);
pass("phase23_owner_smoke_confirmed", proof.manualSmokeResults?.ownerAdminLoginWorks === true && proof.manualSmokeResults?.ownerAdminPermissionsPageWorks === true);
pass("phase23_jane_doe_smoke_confirmed", proof.manualSmokeResults?.janeDoeReadOnlyAdminWorksAsIntended === true && proof.manualSmokeResults?.janeDoeAdminFunctionRestrictionsWork === true && proof.manualSmokeResults?.janeDoeNonAdminOperationalAccessWorks === true);
pass("phase23_rollback_documented", String(proof.rollback || "").includes("BARSH_ADMIN_PERMISSIONS_ENFORCEMENT_ENABLED=false"));
if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 23 final production manual smoke proof safety verifier passed");
