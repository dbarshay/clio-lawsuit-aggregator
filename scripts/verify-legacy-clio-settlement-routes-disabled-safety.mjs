import fs from "node:fs";

let failures = 0;

function read(path) {
  try {
    return fs.readFileSync(path, "utf8");
  } catch {
    failures += 1;
    console.error(`FAIL: missing ${path}`);
    return "";
  }
}

function mustContain(label, text, needle) {
  if (text.includes(needle)) console.log(`PASS: ${label}: found ${needle}`);
  else {
    failures += 1;
    console.error(`FAIL: ${label}: missing ${needle}`);
  }
}

function mustNotContain(label, text, needle) {
  if (!text.includes(needle)) console.log(`PASS: ${label}: does not contain ${needle}`);
  else {
    failures += 1;
    console.error(`FAIL: ${label}: must not contain ${needle}`);
  }
}

const routePaths = [
  "app/api/settlements/writeback-preview/route.ts",
  "app/api/settlements/writeback/route.ts",
  "app/api/settlements/current-values/route.ts",
  "app/api/settlements/provider-fee-defaults/route.ts",
];

const packageJson = read("package.json");

console.log("=== LEGACY CLIO SETTLEMENT ROUTES DISABLED SAFETY VERIFICATION ===");

for (const routePath of routePaths) {
  const route = read(routePath);

  [
    'action: "legacy-clio-settlement-route-disabled"',
    "disabled: true",
    "localFirst: true",
    'sourceOfTruth: "barsh-matters-local"',
    "/api/settlements/local-preview",
    "/api/settlements/local-record-preview",
    "/api/settlements/local-record",
    "clioRecordsChanged: false",
    "databaseRecordsChanged: false",
    "documentsGenerated: false",
    "printQueueChanged: false",
    "mattersClosed: false",
    "settlementWritebackPerformed: false",
    "status: 410",
  ].forEach((needle) => mustContain(routePath, route, needle));

  [
    "clioFetch(",
    "writeSettlementToClio",
    "previewSettlementWritebackToClio",
    "prisma.claimIndex.update",
    "prisma.claimIndex.create",
    "prisma.settlementWriteback.create",
    "method: \"PATCH\"",
    "clioRecordsChanged: true",
    "settlementWritebackPerformed: true",
  ].forEach((needle) => mustNotContain(routePath, route, needle));
}

mustContain("package.json", packageJson, '"verify:legacy-clio-settlement-routes-disabled-safety"');

if (failures) {
  console.error(`=== LEGACY CLIO SETTLEMENT ROUTES DISABLED SAFETY FAILED: ${failures} failure(s) ===`);
  process.exit(1);
}

console.log("=== LEGACY CLIO SETTLEMENT ROUTES DISABLED SAFETY PASSED ===");
