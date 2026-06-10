#!/usr/bin/env node
import fs from "fs";

const pagePath = "app/admin/clients/[id]/invoice/page.tsx";
const source = fs.readFileSync(pagePath, "utf8");

const required = [
  '"Principal / Interest Received": invoice.principalInterestTotal',
  '"Retainer Fee": invoice.retainerFeeTotal',
  '"Net Remit Before Costs": invoice.baseNetRemitToProvider',
  '"Costs Received During This Remittance Period": invoice.filingFeePaymentTotal',
  '"Costs Expended During This Remittance Period": invoice.costsExpendedTotal',
  '"Cost Balance During This Remittance Period": invoice.costBalanceThisRemittancePeriod',
  '"Final Net Remit to Provider": invoice.netRemitToProviderTotal',
  '"Frozen Invoice Line Total": invoice.invoicePackageTotal',
  '>Principal / Interest</th>',
  '>Net Before Costs</th>',
  '>Costs Received</th>',
  '>Costs Expended</th>',
  '>Cost Balance</th>',
  '>Cost Ledger</th>',
  '>Final Net Remit</th>',
  '{money(invoice.netRemitToProviderTotal)}',
  'colSpan={15}>No invoices yet.'
];

const forbidden = [
  '"Invoice Total": invoice.invoicePackageTotal',
  '"Invoice Package Total": invoice.invoicePackageTotal',
  '>Total</th>'
];

const failures = [];

for (const needle of required) {
  if (source.includes(needle) === false) {
    failures.push(`Missing required marker: ${needle}`);
  }
}

for (const needle of forbidden) {
  if (source.includes(needle)) {
    failures.push(`Forbidden stale marker remains: ${needle}`);
  }
}

const exportButtonStillClientSide = source.includes('downloadCsv("provider-client-invoice-history.csv", historyCsvRows)');
if (exportButtonStillClientSide === false) {
  failures.push("History CSV export button no longer uses client-side historyCsvRows downloadCsv path.");
}

const noBackendRouteMutation = source.includes('/api/admin/clients/${encodeURIComponent(id)}/invoice/create-preview') &&
  source.includes('/api/admin/clients/${encodeURIComponent(id)}/invoice/create') &&
  source.includes('/api/admin/clients/${encodeURIComponent(id)}/invoice/${encodeURIComponent(invoiceId)}/finalize');

if (noBackendRouteMutation === false) {
  failures.push("Expected invoice workflow route strings are missing from UI page.");
}

if (failures.length) {
  console.error("FAIL: provider client invoice history remittance totals safety");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PASS: provider client invoice history remittance totals safety");
