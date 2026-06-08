import fs from "fs";

const checks = [
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
    file: "app/admin/clients/[id]/page.tsx",
    tests: [
      ["Invoicing / Remittance", "Client detail page includes invoicing/remittance"],
      ["Notes", "Client detail page includes notes card"],
      ["updateClientForm", "Client detail page has editable form state"],
      ["Add Notes", "Client detail page includes Add Notes action"],
      ["appendNote", "Client detail page sends notes as append-only"],
      ["editableTextRow", "Client detail page uses row-level editable fields"],
      ["Save", "Client detail page includes save button"],
      ["Edit", "Client detail page includes edit button"],
      ["Address", "Client detail page includes client address field"],
      ["Child Matters", "Client detail page includes child matters"],
      ["Payment Receipt Rows", "Client detail page includes receipt rows"],
      ["Export CSV", "Client detail page includes CSV export"],
      ["Client Imported Fields / Defaults", "Client detail page includes imported fields/defaults"],
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
      ["Retainer Principal NF %", "Client detail page surfaces retainer principal default"],
      ["Retainer Interest %", "Client detail page surfaces retainer interest default"],
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
      ["matterPaymentReceipt.findMany", "Client detail API reads MatterPaymentReceipt child ledger"],
      ["does not call Clio", "Client detail API safety copy blocks Clio"],
      ["child-ledger", "Client detail API describes child-ledger source"],
      ["editableClientDetails", "Client detail API updates local editable details"],
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
