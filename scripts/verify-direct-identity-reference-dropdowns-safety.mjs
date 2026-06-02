import fs from "fs";

const file = "app/matter/[id]/page.tsx";
const text = fs.readFileSync(file, "utf8");

const required = [
  "function identityFieldReferenceType(",
  'if (field === "client_name") return "provider_client";',
  'if (field === "insurer_name") return "insurer_company";',
  "function identityFieldUsesReferenceOptions(",
  "function loadIdentityReferenceOptions(",
  "/api/reference-data/options?type=",
  "identityFieldEditSelectedOptionId",
  "fieldValueId: identityFieldEditSelectedOptionId",
  "identityReferenceOptions[identityFieldReferenceType(identityFieldEditModal)]",
  "identityFieldUsesReferenceOptions(identityFieldEditModal) ?",
  "<select",
];

let failed = false;

for (const needle of required) {
  if (!text.includes(needle)) {
    console.error(`FAIL: missing ${needle}`);
    failed = true;
  } else {
    console.log(`PASS: found ${needle}`);
  }
}

if (failed) process.exit(1);

console.log("PASS: direct identity provider/insurer edit uses reference dropdowns.");
