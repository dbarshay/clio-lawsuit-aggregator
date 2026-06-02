import fs from "fs";
import path from "path";

const root = process.cwd();

function read(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing file: ${file}`);
  }
  return fs.readFileSync(full, "utf8");
}

const requiredAreas = [
  {
    label: "Home/Main Provider Search",
    file: "app/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=provider_client"',
      'list="barsh-search-provider-suggestions"',
      "providerReferenceOptions.map",
    ],
  },
  {
    label: "Home Advanced Provider",
    file: "app/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=provider_client"',
      'list="barsh-advanced-provider-reference-options"',
      'id="barsh-advanced-provider-reference-options"',
      "providerReferenceOptions.map",
    ],
  },
  {
    label: "Home Advanced Insurer",
    file: "app/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=insurer_company"',
      'list="barsh-advanced-insurer-reference-options"',
      'id="barsh-advanced-insurer-reference-options"',
      "insurerReferenceOptions.map",
    ],
  },
  {
    label: "Home Advanced Court",
    file: "app/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=court_venue"',
      'list="barsh-advanced-court-reference-options"',
      'id="barsh-advanced-court-reference-options"',
      "courtReferenceOptions.map",
    ],
  },
  {
    label: "Home Advanced Service Type",
    file: "app/page.tsx",
    required: [
      'fetch("/api/advanced-search/picklists"',
      "serviceTypePicklistOptions.map",
    ],
  },
  {
    label: "Home Advanced Denial Reason",
    file: "app/page.tsx",
    required: [
      'fetch("/api/advanced-search/picklists"',
      "denialReasonPicklistOptions.map",
    ],
  },
  {
    label: "Home Advanced Close Reason",
    file: "app/page.tsx",
    required: [
      'fetch("/api/advanced-search/picklists"',
      "closeReasonPicklistOptions.map",
    ],
  },
  {
    label: "Lawsuit Search Provider",
    file: "app/lawsuits/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=provider_client"',
      'list="barsh-lawsuit-provider-reference-options"',
      'id="barsh-lawsuit-provider-reference-options"',
      "providerReferenceOptions.map",
    ],
  },
  {
    label: "Lawsuit Search Insurer",
    file: "app/lawsuits/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=insurer_company"',
      'list="barsh-lawsuit-insurer-reference-options"',
      'id="barsh-lawsuit-insurer-reference-options"',
      "insurerReferenceOptions.map",
    ],
  },
  {
    label: "Master Payment Transaction Type",
    file: "app/matters/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=transaction_type"',
      "masterPaymentTransactionTypeOptions",
    ],
  },
  {
    label: "Master Payment Transaction Status",
    file: "app/matters/page.tsx",
    required: [
      'fetch("/api/reference-data/options?type=transaction_status"',
      "masterPaymentTransactionStatusOptions",
    ],
  },
  {
    label: "Settlement Finalized Settled With",
    file: "app/matters/page.tsx",
    required: [
      'fetch("/api/settlements/contacts"',
      "masterSettlementContacts.map",
      "settlementContactDisplay",
    ],
  },
  {
    label: "Admin Ticklers Provider",
    file: "app/admin/ticklers/page.tsx",
    required: ["provider_client"],
  },
  {
    label: "Admin Ticklers Insurer",
    file: "app/admin/ticklers/page.tsx",
    required: ["insurer_company"],
  },
  {
    label: "Admin Ticklers Court",
    file: "app/admin/ticklers/page.tsx",
    required: ["court_venue"],
  },
  {
    label: "Admin Ticklers Service Type",
    file: "app/admin/ticklers/page.tsx",
    required: ["service_type"],
  },
  {
    label: "Admin Ticklers Denial Reason",
    file: "app/admin/ticklers/page.tsx",
    required: ["denial_reason"],
  },
  {
    label: "Admin Ticklers Closed Reason",
    file: "app/admin/ticklers/page.tsx",
    required: ["closed_reason"],
  },
  {
    label: "Direct Matter Treating Provider",
    file: "app/matter/[id]/page.tsx",
    required: [
      "treating_provider",
      "treatingProviderOptions",
    ],
  },
];

const forbiddenPatterns = [
  {
    label: "Lawsuit plain Provider input",
    file: "app/lawsuits/page.tsx",
    forbidden:
      '<input placeholder="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} style={input} />',
  },
  {
    label: "Lawsuit plain Insurer input",
    file: "app/lawsuits/page.tsx",
    forbidden:
      '<input placeholder="Insurer" value={insurer} onChange={(e) => setInsurer(e.target.value)} style={input} />',
  },
];

let failed = false;

for (const area of requiredAreas) {
  const text = read(area.file);
  const missing = area.required.filter((needle) => !text.includes(needle));

  if (missing.length) {
    failed = true;
    console.error(`FAIL: ${area.label} missing ${missing.join(" | ")}`);
  } else {
    console.log(`PASS: ${area.label}`);
  }
}

for (const item of forbiddenPatterns) {
  const text = read(item.file);

  if (text.includes(item.forbidden)) {
    failed = true;
    console.error(`FAIL: ${item.label} still present`);
  } else {
    console.log(`PASS: ${item.label} removed`);
  }
}

if (failed) process.exit(1);

console.log("PASS: editable non-patient reference wiring safety verifier passed.");
