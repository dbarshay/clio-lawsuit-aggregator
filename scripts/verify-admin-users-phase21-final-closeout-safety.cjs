const fs = require("fs");

const lib = fs.readFileSync("lib/adminPermissions.ts", "utf8");
const page = fs.readFileSync("app/admin/permissions/page.tsx", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

function pass(name, ok) {
  if (!ok) {
    console.error(`FAIL: ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${name}`);
  }
}

pass("phase16_to_21_registered", Boolean(pkg.scripts["verify:admin-users-phase16a-permission-simulator-safety"] && pkg.scripts["verify:admin-users-phase17d-user-preview-closeout-safety"] && pkg.scripts["verify:admin-users-phase18d-activation-readiness-closeout-safety"] && pkg.scripts["verify:admin-users-phase19d-activation-design-closeout-safety"] && pkg.scripts["verify:admin-users-phase20-combined-activation-safety"] && pkg.scripts["verify:admin-users-phase21-combined-deployment-package-safety"]));
pass("phase21_keeps_runtime_manual", lib.includes("the app does not self-activate enforcement") && page.includes("Runtime Changed: No"));
pass("phase21_has_rollback_env", lib.includes("rollbackEnv") && lib.includes('BARSH_ADMIN_PERMISSIONS_ENFORCEMENT_ENABLED: "false"'));
pass("phase21_has_recommended_override_json", lib.includes("BARSH_ADMIN_PERMISSION_OVERRIDES_JSON") && lib.includes("JSON.stringify(recommendedOverrides)"));
pass("phase21_no_app_activation_button", !page.includes("Activate Now") && !page.includes("Enable Enforcement"));
pass("phase21_no_forbidden_identity_features", !lib.includes("passwordHash:") && !lib.includes("passwordHash =") && !lib.includes("impersonateUser") && !lib.includes("accessAsUser") && !page.includes("Access As") && !page.includes("Show Password"));
pass("phase21_readonly_status_and_package_panels", page.includes('data-barsh-admin-permissions-phase20-activation-status="read-only"') && page.includes('data-barsh-admin-permissions-phase21-deployment-package="read-only"'));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 21 final closeout safety verifier passed");
