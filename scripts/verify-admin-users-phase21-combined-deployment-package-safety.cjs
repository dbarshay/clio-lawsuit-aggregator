const fs = require("fs");

const lib = fs.readFileSync("lib/adminPermissions.ts", "utf8");
const registry = fs.readFileSync("app/api/admin/permissions/route.ts", "utf8");
const route = fs.readFileSync("app/api/admin/permissions/deployment-package/route.ts", "utf8");
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

pass("phase21_contract_present", lib.includes("PHASE21_ADMIN_PERMISSIONS_DEPLOYMENT_PACKAGE") && lib.includes('phase: "21-combined"') && lib.includes('mode: "deployment-package-only"'));
pass("phase21_package_helper_present", lib.includes("phase21ActivationDeploymentPackage") && lib.includes("activationEnv") && lib.includes("rollbackEnv"));
pass("phase21_uses_phase20_status", lib.includes("const phase20 = phase20ActivationStatus()") && lib.includes("phase20Status: phase20"));
pass("phase21_manual_env_only", lib.includes("Deployment package only") && lib.includes("the app does not self-activate enforcement"));
pass("phase21_no_runtime_flip", lib.includes("runtimeEnforcementChanged: false") && !lib.includes("process.env.BARSH_ADMIN_PERMISSIONS_ENFORCEMENT_ENABLED ="));
pass("phase21_endpoint_get_only", route.includes("export async function GET()") && !route.includes("export async function POST") && route.includes("Read-only Phase 21 deployment package"));
pass("phase21_registry_exposes_package", registry.includes("phase21ActivationDeploymentPackage") && registry.includes("phase21DeploymentPackage: phase21ActivationDeploymentPackage()"));
pass("phase21_ui_panel_present", page.includes('data-barsh-admin-permissions-phase21-deployment-package="read-only"') && page.includes("Phase 21 Deployment / Rollback Package"));
pass("phase21_ui_no_activation_button", !page.includes("Activate Now") && !page.includes("Enable Enforcement"));
pass("phase21_no_password_visibility_or_impersonation", !lib.includes("passwordHash:") && !lib.includes("passwordHash =") && !lib.includes("impersonateUser") && !lib.includes("accessAsUser") && !page.includes("Access As") && !page.includes("Show Password"));
pass("phase21_no_write_endpoints", !route.includes("/api/admin/users/assign-role") && !route.includes("/api/admin/users/remove-role") && !route.includes("/api/admin/users/permission-override") && !route.includes("/api/admin/users/create") && !route.includes("/api/admin/users/lockout") && !route.includes("/api/admin/users/password-reset"));
pass("phase21_verifier_registered", Boolean(pkg.scripts && pkg.scripts["verify:admin-users-phase21-combined-deployment-package-safety"]));

if (process.exitCode) process.exit(process.exitCode);
console.log("RESULT: Phase 21 combined deployment package safety verifier passed");
