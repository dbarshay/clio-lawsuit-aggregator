export type TemplateBuilderMergeFieldKind = "canonical" | "signatureHeader" | "customManual";

export type TemplateBuilderFieldType = "Text" | "Date" | "Amount" | "Number";

export type TemplateBuilderFormatModifier =
  | "upper"
  | "lower"
  | "title"
  | "date:MM/DD/YYYY"
  | "date:Month D, YYYY"
  | "currency"
  | "bold"
  | "italic"
  | "underline";

export type TemplateBuilderCategory = {
  id: string;
  label: string;
  fixed?: boolean;
  deletable: boolean;
  renamable: boolean;
  appearsLast?: boolean;
  subcategories?: TemplateBuilderCategory[];
};

export type TemplateBuilderMergeFieldDefinition = {
  kind: TemplateBuilderMergeFieldKind;
  category: string;
  subcategory?: string;
  fieldLabel: string;
  mergeField: string;
  exampleOutput: string;
  aliases: string[];
  fieldType: TemplateBuilderFieldType;
  compatibleModifiers: TemplateBuilderFormatModifier[];
  uiLabelEditable: boolean;
  uiCategoryEditable: boolean;
  tokenEditable: boolean;
};

export type TemplateBuilderCustomPlaceholderDefinition = {
  category: string;
  fieldLabel: string;
  mergeFieldToken: string;
  generationPrompt: string;
  exampleValue: string;
  required: boolean;
  fieldType: TemplateBuilderFieldType;
};

export const TEMPLATE_BUILDER_GENERAL_CATEGORY_ID = "general" as const;

export const TEMPLATE_BUILDER_STARTING_CATEGORIES: TemplateBuilderCategory[] = [
  {
    id: "matter",
    label: "Matter",
    deletable: true,
    renamable: true,
  },
  {
    id: "people",
    label: "People",
    deletable: true,
    renamable: true,
    subcategories: [
      {
        id: "signature-header",
        label: "Signature/Header",
        deletable: true,
        renamable: true,
      },
    ],
  },
  {
    id: TEMPLATE_BUILDER_GENERAL_CATEGORY_ID,
    label: "General",
    fixed: true,
    deletable: false,
    renamable: false,
    appearsLast: true,
  },
];

export const TEMPLATE_BUILDER_SUPPORTED_FORMAT_MODIFIERS: TemplateBuilderFormatModifier[] = [
  "upper",
  "lower",
  "title",
  "date:MM/DD/YYYY",
  "date:Month D, YYYY",
  "currency",
  "bold",
  "italic",
  "underline",
];

export const TEMPLATE_BUILDER_CANONICAL_MERGE_FIELDS: TemplateBuilderMergeFieldDefinition[] = [
  {
    kind: "canonical",
    category: "Matter",
    fieldLabel: "Matter File Number",
    mergeField: "{{matter.fileNumber}}",
    exampleOutput: "BRL_202600003",
    aliases: ["matter id", "file number", "BM number", "BRL number"],
    fieldType: "Text",
    compatibleModifiers: ["upper", "lower", "title", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "canonical",
    category: "Matter",
    fieldLabel: "Provider Name",
    mergeField: "{{matter.providerName}}",
    exampleOutput: "Atlantic Medical & Diagnostic, P.C.",
    aliases: ["client", "medical provider", "provider"],
    fieldType: "Text",
    compatibleModifiers: ["upper", "lower", "title", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "canonical",
    category: "Matter",
    fieldLabel: "Patient Name",
    mergeField: "{{matter.patientName}}",
    exampleOutput: "David Barshay",
    aliases: ["claimant", "assignor", "patient"],
    fieldType: "Text",
    compatibleModifiers: ["upper", "lower", "title", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "canonical",
    category: "Matter",
    fieldLabel: "Claim Number",
    mergeField: "{{matter.claimNumber}}",
    exampleOutput: "123456",
    aliases: ["claim", "insurer claim", "carrier claim"],
    fieldType: "Text",
    compatibleModifiers: ["upper", "lower", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "canonical",
    category: "Matter",
    fieldLabel: "Date of Service",
    mergeField: "{{matter.dateOfService}}",
    exampleOutput: "06/24/2026",
    aliases: ["DOS", "service date"],
    fieldType: "Date",
    compatibleModifiers: ["date:MM/DD/YYYY", "date:Month D, YYYY", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "canonical",
    category: "Matter",
    fieldLabel: "Billed Amount",
    mergeField: "{{matter.billedAmount}}",
    exampleOutput: "$1,234.56",
    aliases: ["bill", "amount billed", "charges"],
    fieldType: "Amount",
    compatibleModifiers: ["currency", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "signatureHeader",
    category: "People",
    subcategory: "Signature/Header",
    fieldLabel: "Signature Phone Line",
    mergeField: "{{signature.phoneLine}}",
    exampleOutput: "Usage note: DOCX hard-codes Tel:. Token renders firm main number plus selected signer extension when present.",
    aliases: ["phone", "tel", "telephone", "extension", "header phone"],
    fieldType: "Text",
    compatibleModifiers: ["bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "signatureHeader",
    category: "People",
    subcategory: "Signature/Header",
    fieldLabel: "Signature Fax Number",
    mergeField: "{{signature.faxNumber}}",
    exampleOutput: "Usage note: DOCX hard-codes Fax:. Token renders selected signer fax, or firm default.",
    aliases: ["fax", "facsimile", "header fax"],
    fieldType: "Text",
    compatibleModifiers: ["bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "signatureHeader",
    category: "People",
    subcategory: "Signature/Header",
    fieldLabel: "Signature Email",
    mergeField: "{{signature.email}}",
    exampleOutput: "Usage note: DOCX hard-codes Email:. Token renders selected signer email, or firm default.",
    aliases: ["email", "mail", "header email"],
    fieldType: "Text",
    compatibleModifiers: ["lower", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "signatureHeader",
    category: "People",
    subcategory: "Signature/Header",
    fieldLabel: "Signature Image",
    mergeField: "{{signature.image}}",
    exampleOutput: "Usage note: renders the selected signer PNG signature image when available and otherwise removes token text.",
    aliases: ["signature image", "signature png", "signer image"],
    fieldType: "Text",
    compatibleModifiers: [],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "signatureHeader",
    category: "People",
    subcategory: "Signature/Header",
    fieldLabel: "Signature Name",
    mergeField: "{{signature.name}}",
    exampleOutput: "Usage note: renders selected signer signatureBlockName, or Barshay, Rizzo & Lopez, PLLC for Firm.",
    aliases: ["signature name", "signer name", "closing name"],
    fieldType: "Text",
    compatibleModifiers: ["upper", "lower", "title", "bold", "italic", "underline"],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
  {
    kind: "signatureHeader",
    category: "People",
    subcategory: "Signature/Header",
    fieldLabel: "Signature Block",
    mergeField: "{{signature.block}}",
    exampleOutput: "Usage note: renders image if available followed by signature name. Spacing is controlled by the Word template. Not marked Recommended.",
    aliases: ["signature block", "combined signature", "closing block"],
    fieldType: "Text",
    compatibleModifiers: [],
    uiLabelEditable: true,
    uiCategoryEditable: true,
    tokenEditable: false,
  },
];

export const TEMPLATE_BUILDER_CUSTOM_PLACEHOLDER_FIELDS = [
  "Category",
  "Field Label",
  "Merge Field Token",
  "Prompt shown during document generation",
  "Example value",
  "Required",
  "Field Type",
] as const;

export const TEMPLATE_BUILDER_CUSTOM_PLACEHOLDER_FIELD_TYPES: TemplateBuilderFieldType[] = [
  "Text",
  "Date",
  "Amount",
  "Number",
];

export const TEMPLATE_BUILDER_CUSTOM_TOKEN_PREFIX = "{{custom" as const;

export function templateBuilderTokenForCustomLabel(fieldLabel: string) {
  const words = String(fieldLabel || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

  const pascal = words
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join("");

  if (!pascal) return "{{custom.placeholder}}";
  return "{{custom." + pascal.slice(0, 1).toLowerCase() + pascal.slice(1) + "}}";
}

export function templateBuilderCanonicalTokenSet() {
  return new Set(TEMPLATE_BUILDER_CANONICAL_MERGE_FIELDS.map((field) => field.mergeField));
}

export function templateBuilderIsCustomToken(token: string) {
  return /^\{\{custom\.[a-zA-Z][a-zA-Z0-9]*\}\}$/.test(String(token || "").trim());
}

export function templateBuilderCustomTokenConflicts(token: string, existingCustomTokens: string[] = []) {
  const cleanToken = String(token || "").trim();
  return templateBuilderCanonicalTokenSet().has(cleanToken) || existingCustomTokens.includes(cleanToken);
}

export function templateBuilderSortFieldsByLabel<T extends { fieldLabel: string }>(fields: T[]) {
  return [...fields].sort((a, b) => a.fieldLabel.localeCompare(b.fieldLabel));
}

export function templateBuilderMoveDeletedCategoryFieldsToGeneral<T extends { category: string }>(fields: T[], deletedCategory: string) {
  return fields.map((field) => field.category === deletedCategory ? { ...field, category: "General" } : field);
}
