import fs from "node:fs";

const page = fs.readFileSync("app/admin/users/page.tsx", "utf8");
const session = fs.readFileSync("app/api/auth/session/route.ts", "utf8");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

const failures = [];
function must(ok, message) {
  if (ok) console.log("PASS:", message);
  else {
    console.error("FAIL:", message);
    failures.push(message);
  }
}

console.log("RUN: verify Admin Users role card labels and role guide");

must(page.includes("adminUsersPhaseV4EGrantedAdminCardLabels"), "Users page defines granted Admin-card label helper");
must(page.includes("adminUsersPhaseV4ERoleDisplay"), "Users page defines role display helper");
must(page.includes('data-barsh-admin-users-phase-v4e-role-display="true"'), "role display marker present");
must(page.includes('data-barsh-admin-users-phase-v4e-admin-card-labels="true"'), "admin-card labels container marker present");
must(page.includes('data-barsh-admin-users-phase-v4e-admin-card-label="true"'), "admin-card label chip marker present");
must(page.includes('user.roleKeys.includes("administrator")'), "card labels are scoped to administrator role");
must(page.includes("user?.adminCardGrantKeys"), "card labels read saved adminCardGrantKeys");
must(page.includes("finalAdminCardOptions.find"), "card labels resolve names from finalAdminCardOptions");
must(page.includes("adminUsersPhaseV4ERoleDisplay(user)"), "table role cell uses enhanced role display");
must(!page.includes("{roleLabelForUser(user)}"), "table no longer renders plain roleLabelForUser output");
must(page.includes('data-barsh-admin-users-phase-v4e-role-explanation="true"'), "role explanation section is present");
for (const label of ["Owner", "Administrator", "Full User", "Basic User", "View Only"]) {
  must(page.includes(`<strong>${label}</strong>`), `role explanation includes ${label}`);
}
must(page.includes("Save Card Grants"), "card-grant save UI remains present");
must(session.includes('permissionsMode: "default-admin-allow-all"'), "runtime enforcement remains disabled");
must(pkg.scripts?.["verify:admin-users-phase-v4e-role-card-labels"] === "node scripts/verify-admin-users-phase-v4e-role-card-labels.mjs", "package verifier script registered");

if (failures.length) {
  console.error("");
  console.error("FAILURES=" + failures.length);
  process.exit(1);
}

console.log("FAILURES=0");
console.log("PASS: Admin Users table displays granted Admin-card names under Administrator role and explains roles below the table.");
