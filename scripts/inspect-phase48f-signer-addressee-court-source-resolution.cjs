const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "docs", "template-generation-refactor");
const JSON_OUT = path.join(OUT_DIR, "phase48f-signer-addressee-court-source-resolution-inspection.json");
const MD_OUT = path.join(OUT_DIR, "phase48f-signer-addressee-court-source-resolution-inspection.md");

function readIfExists(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (!["node_modules", ".next", ".git", "coverage", "dist"].includes(name)) walk(full, out);
    } else if (/\.(ts|tsx|js|jsx|cjs|md)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

function parsePrismaModels(schemaText) {
  const models = [];
  const re = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let m;
  while ((m = re.exec(schemaText))) {
    const modelName = m[1];
    const body = m[2];
    const fields = [];
    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("//") || line.startsWith("@@")) continue;
      const parts = line.split(/\s+/);
      const fieldName = parts[0];
      const fieldType = parts[1] || "";
      if (!fieldName || fieldName.startsWith("@")) continue;
      fields.push({ fieldName, fieldType, raw: line });
    }
    models.push({ modelName, fields });
  }
  return models;
}

function modelMatches(model, terms) {
  const text = `${model.modelName} ${model.fields.map((f) => f.fieldName).join(" ")}`.toLowerCase();
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function sourceHits(files, terms) {
  const hits = [];
  for (const full of files) {
    const rel = path.relative(ROOT, full);
    const text = readIfExists(full);
    const lower = `${rel}\n${text}`.toLowerCase();
    const matched = terms.filter((term) => lower.includes(term.toLowerCase()));
    if (!matched.length) continue;
    const first = lower.search(new RegExp(matched[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    const excerptStart = Math.max(0, first - 220);
    const excerptEnd = Math.min(text.length, first + 420);
    hits.push({
      file: rel,
      matched,
      excerpt: text.slice(excerptStart, excerptEnd).replace(/\s+/g, " ").trim(),
    });
  }
  return hits.slice(0, 120);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const schemaText = readIfExists(path.join(ROOT, "prisma", "schema.prisma"));
const models = parsePrismaModels(schemaText);
const sourceFiles = walk(path.join(ROOT, "app")).concat(walk(path.join(ROOT, "lib"))).concat(walk(path.join(ROOT, "components")));

const signerTerms = ["adminuser", "user", "signer", "attorney", "email", "phone", "fax", "extension", "owner_admin"];
const addresseeTerms = ["adversary", "insurer", "court", "venue", "settlement", "settled", "contact", "referenceentity", "address", "fax", "email"];
const courtTerms = ["court", "venue", "calendar", "appearance", "index", "docket"];
const settlementTerms = ["settlement", "settled", "contact", "adjuster"];
const generationDialogTerms = ["generate documents", "selected signer", "selectedTemplate", "document generation", "addressee", "reLine", "working-docx"];

const signerModels = models.filter((m) => modelMatches(m, signerTerms));
const addresseeModels = models.filter((m) => modelMatches(m, addresseeTerms));
const courtModels = models.filter((m) => modelMatches(m, courtTerms));
const settlementModels = models.filter((m) => modelMatches(m, settlementTerms));

const proof = {
  ok: true,
  action: "phase48f-signer-addressee-court-source-resolution-inspection",
  modelCount: models.length,
  sourceFileCount: sourceFiles.length,
  inspectedSources: {
    prismaSchema: Boolean(schemaText),
    appSource: true,
    libSource: true,
    componentSource: true,
  },
  signer: {
    requiredBehavior: {
      defaultToLoggedInGeneratingUser: true,
      otherUsersSelectableInGenerateDocumentsDialog: true,
      signerSpecificFaxEmailExtension: true,
    },
    likelyModels: signerModels,
    sourceHits: sourceHits(sourceFiles, signerTerms),
    proposedFields: [
      "signerUserId",
      "signerName",
      "signerTitle",
      "signerPhoneExtension",
      "signerFax",
      "signerEmail",
    ],
    uncertainItems: [
      "Whether AdminUser currently has all signer profile fields or needs an extended signer profile table.",
      "Whether signer title/extension/fax/email should live directly on AdminUser or a separate FirmSignerProfile model.",
    ],
  },
  addressee: {
    allowedSourceTypes: ["adversary_attorney", "insurer", "court", "settled_with_contact", "manual"],
    requiredBehavior: {
      templateWorkflowDefault: true,
      userOverrideInGenerateDocumentsDialog: true,
      manualFallback: true,
    },
    likelyModels: addresseeModels,
    sourceHits: sourceHits(sourceFiles, addresseeTerms),
    proposedFields: [
      "addresseeSourceType",
      "addresseeRole",
      "addresseeName",
      "addresseeCompany",
      "addresseeAttentionLine",
      "addresseeAddressLine1",
      "addresseeAddressLine2",
      "addresseeAddressLine3",
      "addresseeEmail",
      "addresseeFax",
    ],
    uncertainItems: [
      "Exact adversary attorney source field/table for each lawsuit.",
      "Exact insurer contact source where multiple insurer/contact fields exist.",
      "Whether settled_with_contact should come from settlement contacts, adjuster, insurer contact, or a dedicated settled-with entity.",
    ],
  },
  court: {
    likelyModels: courtModels,
    sourceHits: sourceHits(sourceFiles, courtTerms),
    proposedFields: [
      "courtName",
      "courtVenue",
      "courtAddressLine1",
      "courtAddressLine2",
      "courtCity",
      "courtState",
      "courtZip",
      "courtAddressCityStateZip",
      "indexNumber",
      "docketNumber",
    ],
    uncertainItems: [
      "Whether courtName and courtVenue should be separate in every workflow.",
      "Whether indexNumber and docketNumber should be aliases or distinct fields.",
      "Whether court address should come from reference data or stored lawsuit snapshot.",
    ],
  },
  settlementContact: {
    likelyModels: settlementModels,
    sourceHits: sourceHits(sourceFiles, settlementTerms),
    proposedFields: [
      "settledWithContactName",
      "settledWithCompany",
      "settledWithEmail",
      "settledWithFax",
      "settledWithAddressLine1",
      "settledWithAddressLine2",
    ],
  },
  generationDialog: {
    sourceHits: sourceHits(sourceFiles, generationDialogTerms),
    requiredFutureControls: [
      "selectedSignerUserId defaults to current user",
      "selectedAddresseeSourceType defaults from template/workflow",
      "selectedAddresseeId or manual addressee values",
      "editable Re line preview/override",
    ],
  },
  safety: {
    readOnlyInspection: true,
    noDatabaseMutation: true,
    noTemplateMutation: true,
    noFieldMapping: true,
    noDocxConversion: true,
    noClioTouched: true,
    noGraphTouched: true,
    noFinalization: true,
  },
};

fs.writeFileSync(JSON_OUT, JSON.stringify(proof, null, 2));

function modelList(list) {
  return list.slice(0, 20).map((m) => `- \`${m.modelName}\`: ${m.fields.map((f) => f.fieldName).slice(0, 16).join(", ")}`).join("\n") || "- None found.";
}

function hitList(list) {
  return list.slice(0, 25).map((h) => `- \`${h.file}\` — matches: ${h.matched.join(", ")}`).join("\n") || "- None found.";
}

const md = `# Phase 48F — Signer / Addressee / Court Source Resolution Inspection

## Status

Read-only inspection only. This phase does not map fields into templates.

## Goal

Before mapping letterhead, pleading-paper, or Stipulation fields, Barsh Matters needs source-resolution rules for signer fields, addressee source fields, court/caption fields, and Re fields.

## Signer Rule to Implement Later

- Signer defaults to the logged-in Barsh Matters user generating the document.
- Other users must be selectable from the Generate Documents dialog.
- Fax number, email address, and extension are preset per selected signer.

Proposed signer fields:

${proof.signer.proposedFields.map((f) => `- \`{{${f}}}\``).join("\n")}

Likely signer-related models:

${modelList(signerModels)}

Likely signer-related source files:

${hitList(proof.signer.sourceHits)}

Uncertain signer items requiring Dave review:

${proof.signer.uncertainItems.map((i) => `- ${i}`).join("\n")}

## Addressee Source Rule to Implement Later

Allowed addressee source types:

${proof.addressee.allowedSourceTypes.map((s) => `- \`${s}\``).join("\n")}

Required behavior:

- Addressee source defaults from the selected template/workflow.
- User can override the addressee source in the Generate Documents dialog.
- Manual addressee entry remains available.

Proposed addressee fields:

${proof.addressee.proposedFields.map((f) => `- \`{{${f}}}\``).join("\n")}

Likely addressee-related models:

${modelList(addresseeModels)}

Likely addressee-related source files:

${hitList(proof.addressee.sourceHits)}

Uncertain addressee items requiring Dave review:

${proof.addressee.uncertainItems.map((i) => `- ${i}`).join("\n")}

## Court / Caption Source Rule to Implement Later

Proposed court/caption fields:

${proof.court.proposedFields.map((f) => `- \`{{${f}}}\``).join("\n")}

Likely court-related models:

${modelList(courtModels)}

Likely court-related source files:

${hitList(proof.court.sourceHits)}

Uncertain court items requiring Dave review:

${proof.court.uncertainItems.map((i) => `- ${i}`).join("\n")}

## Settled-With Contact Source

Settled-with contact may be used as a letter addressee source.

Proposed settled-with fields:

${proof.settlementContact.proposedFields.map((f) => `- \`{{${f}}}\``).join("\n")}

Likely settlement-contact source files:

${hitList(proof.settlementContact.sourceHits)}

## Generate Documents Dialog Controls Needed Later

${proof.generationDialog.requiredFutureControls.map((c) => `- ${c}`).join("\n")}

Likely generation-dialog source files:

${hitList(proof.generationDialog.sourceHits)}

## Mapping Policy

Ask Dave before implementing or mapping any uncertain signer, addressee, court/caption, settled-with, or Re source.

## Non-Goals

This phase does not write database rows, does not update templates, does not convert DOCX files, does not create Graph/OneDrive working documents, does not upload to Clio, does not finalize documents, and does not change the print queue.

## Next Recommended Phase

Phase 48G should propose the signer profile data model and addressee source-resolution design for Dave review before any implementation.
`;
fs.writeFileSync(MD_OUT, md);

console.log(JSON.stringify({
  ok: proof.ok,
  modelCount: proof.modelCount,
  sourceFileCount: proof.sourceFileCount,
  signerModelCount: signerModels.length,
  addresseeModelCount: addresseeModels.length,
  courtModelCount: courtModels.length,
  settlementModelCount: settlementModels.length,
  json: path.relative(ROOT, JSON_OUT),
  md: path.relative(ROOT, MD_OUT),
  safety: proof.safety,
}, null, 2));
