import fs from "node:fs";

let failed = false;
function must(ok, message) {
  if (!ok) {
    failed = true;
    console.error("FAIL: " + message);
  } else {
    console.log("PASS: " + message);
  }
}
const header = fs.readFileSync("app/components/BarshHeaderActions.tsx", "utf8");

must(header.includes('flexWrap: "nowrap"'), "shared header action row does not wrap");
must(!header.includes('flexWrap: "wrap"'), "shared header action row no longer permits wrapping");
must(!header.includes('transform: "translateX(48px)"'), "shared header no longer shifts actions right into logo space");
must(header.includes('data-barsh-header-administrator-link="true"'), "Administrator link remains present");
must(header.includes('href="/admin"'), "Administrator still navigates to /admin");
must(header.includes('data-barsh-header-signout-button="true"'), "global Sign Out button is present");
must(header.includes('/api/auth/signout'), "global Sign Out uses current signout route");
must(header.includes('/login?from=/admin'), "global Sign Out redirects to login preserving admin return target");
must(header.includes('href="/lawsuits"') && header.includes('href="/print-queue"') && header.includes('href="/court-calendar"'), "Create Lawsuits, Print Queue, and Court Calendar links remain present");

if (failed) {
  console.error("RESULT: Admin Users Workflow Phase T header signout/nowrap verifier failed");
  process.exit(1);
}
console.log("PASS: Admin Users Workflow Phase T header Sign Out and nowrap layout locked.");
