import fs from "fs";

const routePath = "app/api/documents/finalization-history/route.ts";
const route = fs.readFileSync(routePath, "utf8");

const required = [
  "action: \"document-delivery-history\"",
  "prisma.documentFinalization.findMany",
  "prisma.documentPrintQueueItem.findMany",
  "prisma.emailThread.findMany",
  "prisma.emailMatterLink.findMany",
  "prisma.emailFilingLog.findMany",
  "readOnly: true",
  "noClioRecordsChanged: true",
  "noDatabaseRecordsChanged: true",
  "noEmailSent: true",
  "events",
  "sections",
  "function safeString(value: unknown): string | null",
  "masterLawsuitId",
  "matterId",
  "matterDisplayNumber",
  "clioMatterId",
  "clioDisplayNumber",
];

const forbidden = [
  ".create(",
  ".createMany(",
  ".update(",
  ".updateMany(",
  ".upsert(",
  ".delete(",
  ".deleteMany(",
  "fetch(",
  "graph.microsoft.com",
  "sendMail",
  "messages/send",
  "clioRecordsChanged: true",
  "noDatabaseRecordsChanged: false",
  "noEmailSent: false",
];

const failures = [];

for (const marker of required) {
  if (!route.includes(marker)) failures.push(`missing required marker: ${marker}`);
}

for (const marker of forbidden) {
  if (route.includes(marker)) failures.push(`forbidden marker present: ${marker}`);
}

if (!route.includes("export const runtime = \"nodejs\"")) {
  failures.push("route must remain nodejs runtime");
}

if (!route.includes("Missing lookup")) {
  failures.push("route must reject empty lookups");
}

if (failures.length) {
  console.error("FAIL: document delivery history safety verifier failed");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: document delivery history route is read-only and covers finalizations, print queue, email drafts/messages, links, and filing logs.");
