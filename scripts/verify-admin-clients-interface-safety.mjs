import fs from "fs";

const checks = [
  {
    file: "prisma/schema.prisma",
    tests: [
      ["model ProviderClientInfo", "Prisma has ProviderClientInfo source-of-truth model"],
      ["providerClientInfo ProviderClientInfo?", "ReferenceEntity links to ProviderClientInfo"],
    ],
  },
  {
    file: "app/admin/page.tsx",
    tests: [
      ['href: "/admin/clients"', "Admin Home links to Clients"],
      ['label: "Clients"', "Admin Home has Clients card label"],
    ],
  },
  {
    file: "app/admin/clients/page.tsx",
    tests: [
      ["/api/admin/clients", "Clients page loads local admin clients API"],
      ["encodeURIComponent(row.id)", "Clients table links client names to detail pages"],
    ],
  },
  {
    file: "app/admin/clients/[id]/invoice/page.tsx",
    tests: [
      ["Provider Client Invoice Workflow", "Invoice screen has provider client workflow heading"],
      ["Invoicing / Remittance", "Invoice screen includes invoicing/remittance workflow"],
      ["option value=\"All\"", "Invoice screen transaction type dropdown includes All"],
      ["Direct Pay", "Invoice screen transaction type dropdown includes Direct Pay"],
      ["Voluntary", "Invoice screen transaction type dropdown includes Voluntary"],
      ["Collection", "Invoice screen transaction type dropdown includes Collection"],
      ["Interest", "Invoice screen transaction type dropdown includes Interest"],
      ["Attorney Fee", "Invoice screen transaction type dropdown includes Attorney Fee"],
      ["Filing Fee", "Invoice screen transaction type dropdown includes Filing Fee"],
      ["useState(\"All\")", "Invoice screen defaults transaction type to All"],
      ["Principal and Interest Payments", "Invoice screen includes principal and interest payment table"],
      ["Filing Fee Payments", "Invoice screen includes filing fee payment table"],
      ["Filing Fee and Costs Expended", "Invoice screen includes filing fee and costs expended table"],
      ["costsExpendedRows", "Invoice screen consumes costs expended rows"],
      ["costsExpendedTable", "Invoice screen renders costs expended table"],
      ["Cost/Fee Type", "Invoice screen labels cost type column"],
      ["Date Entered", "Invoice screen labels cost entry-date column"],
      ["costsExpendedCsvRows", "Invoice CSV includes costs expended rows"],
      ["Date of Loss", "Invoice screen includes Date of Loss column"],
      ["Date of Service", "Invoice screen includes Date of Service column"],
      ["Case Type", "Invoice screen includes Case Type column"],
      ["width: 42", "Invoice screen keeps Case Type column narrow"],
      ["Date Posted", "Invoice screen includes Date Posted column"],
      ["Check Number", "Invoice screen includes Check Number column"],
      ["Billed Amount", "Invoice screen includes Billed Amount column"],
      ["Payment Amount", "Invoice screen includes Payment Amount column"],
      ["Retainer Fee", "Invoice screen includes Retainer Fee column"],
      ["invoiceThStyle", "Invoice screen uses gridline header style"],
      ["textAlign: \"center\"", "Invoice screen centers receipt table column headers"],
      ["invoiceTdStyle", "Invoice screen uses gridline cell style"],
      ["tableLayout: \"fixed\"", "Invoice screen fits receipt grid without horizontal scrolling"],
      ["overflowX: \"visible\"", "Invoice screen avoids horizontal scrolling for receipt grid"],
      ["overflowWrap: \"break-word\"", "Invoice screen wraps receipt grid text"],
      ["invoiceTotalTdStyle", "Invoice screen uses gridline total style"],
      ["Totals", "Invoice screen includes table totals row"],
      ["displayDate", "Invoice screen displays placeholders for missing dates"],
      ["isoDateOnly", "Invoice screen formats YYYY-MM-DD dates without timezone shift"],
      ["isoDateTime", "Invoice screen formats ISO datetime dates without timezone shift"],
      ["displayDateRange", "Invoice screen displays DOS ranges when present"],
      ["dateOfServiceEnd", "Invoice screen consumes DOS end date"],
      ["sortedRemittanceRows", "Invoice screen sorts receipt rows"],
      ["principalInterestRows", "Invoice screen separates principal/interest payment rows"],
      ["principalInterestTotals", "Invoice screen totals principal/interest rows"],
      ["filingFeeTotals", "Invoice screen totals filing fee rows"],
      ["totalsForRows", "Invoice screen uses shared table total calculation"],
      ["filingFeeRows", "Invoice screen separates filing fee payment rows"],
      ["isFilingFeePayment", "Invoice screen identifies filing fee payment rows"],
      ["isFeeRecoveryTransactionType", "Invoice screen identifies filing/court fee recoveries"],
      ["if (isFeeRecoveryTransactionType(row?.transactionType)) return 0", "Invoice screen charges no retainer on filing/court fee recoveries"],
      ["{ feeRecovery: true }", "Invoice screen renders filing fee table in fee-recovery mode"],
      ["colSpan={feeRecovery ? 11 : 13}", "Invoice screen uses narrower filing fee recovery table"],
      ["court fee", "Invoice screen classifies court fee rows with filing fee payments"],
      ["other court fees", "Invoice screen classifies other court fee rows with filing fee payments"],
      ["paymentRowsTable", "Invoice screen reuses payment table renderer"],
      ["sortField", "Invoice screen tracks active sort field"],
      ["sortDirection", "Invoice screen tracks sort direction"],
      ["sortableHeader", "Invoice screen has sortable receipt headers"],
      ["changeSort", "Invoice screen toggles receipt column sorting"],
      ["retainerFeeForReceipt", "Invoice screen calculates retainer fee from provider defaults"],
      ["function numberFromPercent", "Invoice screen defines percent-to-rate helper"],
      ["return numeric / 100", "Invoice screen converts percent values to decimal rates"],
      ["Export CSV", "Invoice screen includes CSV export"],
      ["Child-matter-based local payment reporting", "Invoice screen states child-matter reporting rule"],
      ["MatterPaymentReceipt", "Invoice screen states child receipt ledger source"],
      ["/api/admin/clients", "Invoice screen reads existing admin client detail API"],
    ],
  },
  {
    file: "app/admin/clients/[id]/page.tsx",
    tests: [
      ["Invoicing / Remittance", "Client detail page includes invoicing/remittance"],
      ["Workflow Actions", "Client detail page includes workflow action hub"],
      ["Invoicing / Remittance", "Client detail page has invoicing/remittance action button"],
      ["/invoice", "Client detail page launches invoice screen from invoicing action"],
      ["lawsuitRows", "Client detail page derives lawsuit matter summary from individual matters"],
      ["activeWorkflowPanel", "Client detail page hides operational reports behind action buttons"],
      ["setActiveWorkflowPanel", "Client detail page launches action panels from buttons"],
      ["Notes", "Client detail page includes notes card"],
      ["updateClientForm", "Client detail page has editable form state"],
      ["Add Notes", "Client detail page includes Add Notes action"],
      ["appendNote", "Client detail page sends notes as append-only"],
      ["editableTextRow", "Client detail page uses row-level editable fields"],
      ["Save", "Client detail page includes save button"],
      ["Edit", "Client detail page includes edit button"],
      ["Address", "Client detail page includes client address field"],
      ["titleCaseAddressSegment", "Client detail page normalizes address capitalization"],
      ["normalizeAddressLineDisplay", "Client detail page normalizes address lines"],
      ["Individual Matters", "Client detail page includes individual matters"],
      ["Lawsuit Matters", "Client detail page includes lawsuit matters action panel"],
      ["Export CSV", "Client detail page includes CSV export"],
      ["Owner", "Client detail page surfaces owner field"],
      ["Provider Group", "Client detail page surfaces provider group"],
      ["Retainer NF Principal", "Client detail page surfaces NF principal retainer"],
      ["Retainer NF Interest", "Client detail page surfaces NF interest retainer"],
      ["Retainer WC Principal", "Client detail page surfaces WC principal retainer"],
      ["Retainer WC Interest", "Client detail page surfaces WC interest retainer"],
      ["Retainer Liens Principal", "Client detail page surfaces liens principal retainer"],
      ["Retainer Liens Interest", "Client detail page surfaces liens interest retainer"],
      ["Pull Costs", "Client detail page surfaces pull costs field"],
      ["Remit", "Client detail page surfaces remit field"],
      ["editableSelectRow", "Client detail page uses select rows for controlled defaults"],
    ],
  },
  {
    file: "app/api/admin/clients/route.ts",
    tests: [
      ['type: "provider_client"', "Clients API is scoped to provider_client"],
      ["ReferenceEntity/ReferenceAlias", "Clients API declares local reference source of truth"],
      ["does not call Clio", "Clients API safety copy blocks Clio"],
    ],
  },
  {
    file: "app/api/admin/clients/[id]/route.ts",
    tests: [
      ["provider_client", "Client detail API is scoped to provider_client"],
      ["claimIndex.findMany", "Client detail API reads ClaimIndex child matters"],
      ["compactProviderName", "Client detail API normalizes provider matching"],
      ["providerSearchTerms(nameCandidates)", "Client detail API searches provider tokens case-insensitively"],
      ["claimMatchesProviderCandidate", "Client detail API post-filters ClaimIndex provider matches"],
      ["matterPaymentReceipt.findMany", "Client detail API reads MatterPaymentReceipt child ledger"],
      ["lawsuit.findMany", "Client detail API reads local lawsuit cost metadata"],
      ["expendedCostRows", "Client detail API builds costs expended rows"],
      ["costsExpended", "Client detail API exposes costs expended response"],
      ["costEntryDateFromOptions", "Client detail API uses per-cost entry dates for costs report"],
      ["costEntryDateInSelectedPeriod", "Client detail API filters costs by entry date"],
      ["lawsuit.masterLawsuitId", "Client detail API matches costs by master lawsuit id"],
      ["options.masterLawsuitId", "Client detail API matches costs by option master lawsuit id"],
      ["options.master_lawsuit_id", "Client detail API matches costs by snake-case option master lawsuit id"],
      ["options.indexAaaNumber", "Client detail API matches costs by lawsuit index number"],
      ["options.indexNumber", "Client detail API matches costs by index number alias"],
      ["claim.master_lawsuit_id", "Client detail API maps child claims by master lawsuit id"],
      ["claim.masterLawsuitId", "Client detail API maps child claims by camel-case master lawsuit id"],
      ["row.master_lawsuit_id", "Client detail API includes child master lawsuit id in matter key set"],
      ["row.masterLawsuitId", "Client detail API includes camel-case child master lawsuit id in matter key set"],
      ["filingFeeEntryDate", "Client detail API reads filing fee entry date"],
      ["serviceFeeEntryDate", "Client detail API reads service fee entry date"],
      ["otherCourtCostsEntryDate", "Client detail API reads other court costs entry date"],
      ["does not call Clio", "Client detail API safety copy blocks Clio"],
      ["child-ledger", "Client detail API describes child-ledger source"],
      ["editableClientDetails", "Client detail API updates local editable details"],
      ["providerClientInfo.upsert", "Client detail API writes ProviderClientInfo source table"],
      ["ProviderClientInfo source-of-truth", "Client detail API declares ProviderClientInfo as source of truth"],
      ["hidden_owner", "Client detail API stores owner locally"],
      ["hidden_pull_costs", "Client detail API stores pull costs locally"],
      ["hidden_remit", "Client detail API stores remit locally"],
      ["appendClientNote", "Client detail API appends timestamped notes"],
      ["timestampedClientNote", "Client detail API timestamps notes"],
      ["PATCH", "Client detail API supports local client detail updates"],
      ["createMatterAuditLogEntry", "Client detail API writes audit log entries"],
      ["admin-client-note-add", "Client detail API audits appended notes"],
      ["admin-client-info", "Client detail API uses admin client workflow audit marker"],
    ],
  },
];

let failures = 0;

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    console.error(`FAIL missing ${check.file}`);
    failures++;
    continue;
  }
  const text = fs.readFileSync(check.file, "utf8");
  for (const [needle, label] of check.tests) {
    if (!text.includes(needle)) {
      console.error(`FAIL ${label}: missing ${needle} in ${check.file}`);
      failures++;
    } else {
      console.log(`PASS ${label}`);
    }
  }
}

const forbidden = [
  ["app/api/admin/clients/route.ts", "clio"],
  ["app/api/admin/clients/[id]/route.ts", "clio"],
];

for (const [file, needle] of forbidden) {
  const text = fs.readFileSync(file, "utf8").toLowerCase();
  const occurrences = [...text.matchAll(new RegExp(needle, "g"))].length;
  // Safety copy may mention Clio; imports/calls should not exist.
  if (/from\s+["'].*clio|clioClient|fetchClio|updateClio|postToClio/i.test(fs.readFileSync(file, "utf8"))) {
    console.error(`FAIL ${file} appears to import/call Clio`);
    failures++;
  } else {
    console.log(`PASS ${file} has no Clio import/client call (${occurrences} safety-copy mention(s) allowed)`);
  }
}

if (failures) {
  console.error(`FAILURES=${failures}`);
  process.exit(1);
}

console.log("PASS admin clients interface safety verifier");

const feeDefaultsRoute = fs.readFileSync("app/api/settlements/local-provider-fee-defaults/route.ts", "utf8");
if (!feeDefaultsRoute.includes("providerClientInfo")) {
  console.error("FAIL provider fee defaults route reads ProviderClientInfo");
  failures++;
} else {
  console.log("PASS provider fee defaults route reads ProviderClientInfo");
}
