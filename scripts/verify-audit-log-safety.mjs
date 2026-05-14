import fs from "fs";

const requiredFiles = [
  "prisma/schema.prisma",
  "lib/auditLog.ts",
  "app/api/audit-log/route.ts",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing required audit log file: ${file}`);
  }
}

const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
const helper = fs.readFileSync("lib/auditLog.ts", "utf8");
const route = fs.readFileSync("app/api/audit-log/route.ts", "utf8");

const requiredSchemaSnippets = [
  "model AuditLog",
  "matterId",
  "matterDisplayNumber",
  "masterMatterId",
  "masterMatterDisplayNumber",
  "masterLawsuitId",
  "priorValue",
  "newValue",
  "affectedMatterIds",
  "@@index([matterId])",
  "@@index([masterLawsuitId])",
];

for (const snippet of requiredSchemaSnippets) {
  if (!schema.includes(snippet)) {
    throw new Error(`AuditLog schema is missing required snippet: ${snippet}`);
  }
}

const combined = `${helper}\n${route}`;

const forbiddenSnippets = [
  "clioFetch",
  "getValidClioAccessToken",
  "CLIO_API_BASE",
  "app.clio.com",
  "upsertClaimIndexFromMatter",
  "ingestMattersFromClioBatch",
  "printQueue",
  "settlementWriteback",
  "documents-preview",
  "finalize-upload",
  "paymentPosting",
];

for (const snippet of forbiddenSnippets) {
  if (combined.includes(snippet)) {
    throw new Error(`Audit log layer must remain local-only; found forbidden snippet: ${snippet}`);
  }
}

if (!route.includes("prisma.auditLog.findMany")) {
  throw new Error("Audit log route must read only from prisma.auditLog.");
}

if (!helper.includes("prisma.auditLog.create")) {
  throw new Error("Audit helper must write only to prisma.auditLog.");
}

console.log("Audit log safety verifier passed: local DB only, matter-specific fields present, no Clio/document/print/payment/settlement writes.");
