export type BarshDocumentTemplateCategory =
  | "settlement"
  | "lawsuit"
  | "direct_matter"
  | "payment"
  | "general";

export type BarshDocumentTemplateDefinition = {
  key: string;
  label: string;
  category: BarshDocumentTemplateCategory;
  description: string;
  defaultFilenameSuffix: string;
  generationEndpoint: string;
  outputFormat: "docx" | "pdf" | "both";
  sourceOfTruth: "barsh-matters-local";
  requiresFinalizationBeforeDelivery: boolean;
  enabled: boolean;
  mergeFieldSet: string;
};

export const SETTLEMENT_DOCUMENT_TEMPLATES: BarshDocumentTemplateDefinition[] = [
  {
    key: "settlement-summary",
    label: "Settlement Summary",
    category: "settlement",
    description: "Summary of the active local settlement record and settlement totals.",
    defaultFilenameSuffix: "Settlement Summary",
    generationEndpoint: "/api/settlements/settlement-summary",
    outputFormat: "docx",
    sourceOfTruth: "barsh-matters-local",
    requiresFinalizationBeforeDelivery: true,
    enabled: true,
    mergeFieldSet: "settlement",
  },
  {
    key: "provider-remittance-breakdown",
    label: "Provider Remittance Breakdown",
    category: "settlement",
    description: "Provider remittance breakdown using local settlement rows, provider fees, and provider net amounts.",
    defaultFilenameSuffix: "Provider Remittance Breakdown",
    generationEndpoint: "/api/settlements/provider-remittance-breakdown",
    outputFormat: "docx",
    sourceOfTruth: "barsh-matters-local",
    requiresFinalizationBeforeDelivery: true,
    enabled: true,
    mergeFieldSet: "settlement",
  },
  {
    key: "attorney-fee-breakdown",
    label: "Attorney Fee Breakdown",
    category: "settlement",
    description: "Attorney fee breakdown using local settlement row allocations and fee calculations.",
    defaultFilenameSuffix: "Attorney Fee Breakdown",
    generationEndpoint: "/api/settlements/attorney-fee-breakdown",
    outputFormat: "docx",
    sourceOfTruth: "barsh-matters-local",
    requiresFinalizationBeforeDelivery: true,
    enabled: true,
    mergeFieldSet: "settlement",
  },
];

export function enabledSettlementDocumentTemplates() {
  return SETTLEMENT_DOCUMENT_TEMPLATES.filter((template) => template.enabled);
}

export function buildSettlementPlannedDocuments(params: {
  baseName: string;
  blockingErrors: string[];
}) {
  const { baseName, blockingErrors } = params;
  const ready = blockingErrors.length === 0;

  return enabledSettlementDocumentTemplates().map((template) => ({
    key: template.key,
    label: template.label,
    description: template.description,
    filename: `${baseName} - ${template.defaultFilenameSuffix}.docx`,
    status: ready ? "ready-local-settlement-template-docx" : "blocked",
    availableNow: ready,
    generationEndpoint: template.generationEndpoint,
    routeOnly: true,
    category: template.category,
    outputFormat: template.outputFormat,
    sourceOfTruth: template.sourceOfTruth,
    requiresFinalizationBeforeDelivery: template.requiresFinalizationBeforeDelivery,
    mergeFieldSet: template.mergeFieldSet,
    templateRepositorySource: "barsh-matters-code-registry",
    templateRepositoryFuture: "database-backed editable template repository",
  }));
}
