#!/usr/bin/env node

import fs from "node:fs";

const routePath = "app/api/lawsuits/local-generation-create/route.ts";
const route = fs.readFileSync(routePath, "utf8");

const failures = [];

function mustContain(label, needle) {
  if (!route.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function mustContainAny(label, needles) {
  if (!needles.some((needle) => route.includes(needle))) {
    failures.push(`${label}: missing one of ${needles.join(" | ")}`);
  }
}

function mustNotContain(label, needle) {
  if (route.includes(needle)) failures.push(`${label}: forbidden ${needle}`);
}

function countOccurrences(haystack, needle) {
  return haystack.split(needle).length - 1;
}

mustContain("route exports POST handler", "export async function POST");
mustContain("requires selected matter ids", "selectedMatterIds");
mustContain("reads selected rows from local ClaimIndex", "prisma.claimIndex.findMany");
mustContainAny("creates or upserts local Lawsuit row", [
  "prisma.lawsuit.create",
  "prisma.lawsuit.upsert",
  ".lawsuit.create",
  ".lawsuit.upsert",
]);
mustContainAny("links child ClaimIndex rows to local lawsuit", [
  "prisma.claimIndex.updateMany",
  ".claimIndex.updateMany",
  "masterLawsuitId",
]);
mustContain("stores amount sought locally", "amountSought");
mustContain("keeps Index / AAA blank on creation", "indexAaaNumber: null");
mustContain("returns selected matter count", "selectedMatterCount");
mustContain("returns local lawsuit id", "masterLawsuitId");

mustContain("explicitly imports clioFetch only for approved document-shell creation", 'import { clioFetch } from "@/lib/clio";');
mustContain("builds Clio shell description from local master lawsuit id", "MASTER LAWSUIT - ${masterLawsuitId}");
mustContain("derives Clio client from selected child matter shells", "findClientFromChildClioMatters(selectedRows)");
mustContain("reads child Clio matter client only to assign same Clio client to shell", "readClioMatterClient");
mustContain("creates only a Clio master document shell", "createClioMasterMatter");
mustContain("uses Clio matter create endpoint for shell creation", "/api/v4/matters.json");
mustContain("stores Clio assigned matter id in local mapping", "clioMasterMatterId: createdClioMatter.matterId");
mustContain("stores Clio assigned display number in local mapping", "clioMasterDisplayNumber: createdClioMatter.displayNumber");
mustContain("stores Clio shell mapping source", 'clioMasterMappingSource: "barsh-matters-create-lawsuit-confirm"');
mustContain("response returns created Clio matter shell", "createdClioMatter: {");
mustContain("response acknowledges Clio document shell creation", "createsClioDocumentShell: true");
mustContain("response acknowledges narrow Clio shell write", "writesClio: true");
mustContain("response acknowledges Clio master shell creation", "createsClioMasterMatter: true");
mustContain("route states no operational Clio hydration", "noClioOperationalHydration: true");

mustContain("does not upload documents during create", "uploadsDocuments: false");
mustContain("does not send email during create", "sendsEmail: false");
mustContain("does not queue print jobs during create", "queuesPrintJobs: false");

mustNotContain("must not call legacy aggregate route", "/api/aggregate");
mustNotContain("must not call legacy deaggregate route", "/api/deaggregate");
mustNotContain("must not call ClaimIndex rebuild route", "/api/claim-index/rebuild");
mustNotContain("must not call ClaimIndex refresh-cluster route", "/api/claim-index/refresh-cluster");
mustNotContain("must not call separate Clio master confirm route", "/api/documents/clio-master-matter-confirm");
mustNotContain("must not use selected rows to prefill Index / AAA", "indexAaaNumber: selectedRows");
mustNotContain("must not use master lawsuit id as Clio display number", "clioMasterDisplayNumber: masterLawsuitId");
mustNotContain("must not upload documents during create", "clioDocumentUpload");
mustNotContain("must not create Graph draft during create", "createDraft");
mustNotContain("must not send email during create", "sendMail");
mustNotContain("must not queue print jobs during create", "printQueue.create");
mustNotContain("must not use Clio as local identity hydration", "clioMatterToClaimIndex");
mustNotContain("must not refresh from Clio after create", "refreshFromClio");

const clioFetchCount = countOccurrences(route, "clioFetch(");
const clioMatterEndpointCount = countOccurrences(route, "/api/v4/matters.json");

if (clioFetchCount !== 2) {
  failures.push(`approved Clio shell scope: expected exactly 2 clioFetch calls: one child-client read and one master-shell create; found ${clioFetchCount}`);
}

if (clioMatterEndpointCount !== 1) {
  failures.push(`approved Clio shell scope: expected exactly 1 Clio matter-create endpoint string; found ${clioMatterEndpointCount}`);
}

console.log("RESULT: local lawsuit generation create safety");
console.log("FILE=" + routePath);
console.log("EXPECTS_LOCAL_LAWSUIT_CREATE=YES");
console.log("EXPECTS_CHILD_CLAIMINDEX_LINK=YES");
console.log("EXPECTS_INDEX_AAA_BLANK_ON_CREATE=YES");
console.log("EXPECTS_APPROVED_CLIO_DOCUMENT_SHELL_EXCEPTION=YES");
console.log("EXPECTS_CHILD_CLIO_CLIENT_READ_ONLY_FOR_SHELL_CLIENT=YES");
console.log("EXPECTS_NO_CLIO_OPERATIONAL_HYDRATION=YES");
console.log("EXPECTS_NO_DOCUMENT_UPLOAD=YES");
console.log("EXPECTS_NO_EMAIL=YES");
console.log("EXPECTS_NO_PRINT_QUEUE=YES");
console.log("CLIO_FETCH_COUNT=" + clioFetchCount);
console.log("CLIO_MATTER_ENDPOINT_COUNT=" + clioMatterEndpointCount);
console.log("FAILURES=" + failures.length);

for (const failure of failures) console.log("FAIL=" + failure);

if (failures.length) process.exit(1);
