import fs from "node:fs";

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

function pass(message) {
  console.log(`PASS: ${message}`);
}

const routePath = "app/api/ticklers/settlement-payment-due/route.ts";
const pkgPath = "package.json";

const route = fs.readFileSync(routePath, "utf8");
const pkg = fs.readFileSync(pkgPath, "utf8");

const getListWindow = route.slice(
  route.indexOf("const ticklers = await prisma.localWorkflowTickler.findMany"),
  route.indexOf("return NextResponse.json({", route.indexOf("const ticklers = await prisma.localWorkflowTickler.findMany"))
);

const duplicateWindow = route.slice(
  route.indexOf("const existingTickler = await prisma.localWorkflowTickler.findFirst"),
  route.indexOf("const ticklerPlan = {")
);

if (!getListWindow.includes('(includeCompleted ? {} : { status: "open" })')) {
  fail("GET list must return only status open ticklers unless includeCompleted=true.");
} else {
  pass("GET list uses status open for default active tickler list.");
}

if (getListWindow.includes('status: { not: "completed" }')) {
  fail("GET list must not treat voided ticklers as active by using not completed.");
} else {
  pass("GET list no longer uses not-completed active filter.");
}

if (!duplicateWindow.includes('status: "open"')) {
  fail("Duplicate prevention must reuse only open ticklers.");
} else {
  pass("duplicate prevention reuses only open ticklers.");
}

if (duplicateWindow.includes('status: { not: "completed" }')) {
  fail("Duplicate prevention must not treat voided ticklers as reusable active ticklers.");
} else {
  pass("duplicate prevention no longer uses not-completed active filter.");
}

if (!pkg.includes("verify:settlement-payment-due-tickler-open-only-safety")) {
  fail("package.json missing verify:settlement-payment-due-tickler-open-only-safety script.");
} else {
  pass("package.json exposes settlement payment due tickler open-only verifier.");
}

if (!pkg.includes("verify:settlement-payment-due-tickler-open-only-safety")) {
  fail("verifier must be callable before production verification can include it.");
}

if (!process.exitCode) {
  console.log("\nSettlement payment due tickler open-only safety verifier passed.");
}
