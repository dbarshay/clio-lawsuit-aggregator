import {
  TEMPLATE_BUILDER_CANONICAL_MERGE_FIELDS,
  TEMPLATE_BUILDER_SUPPORTED_FORMAT_MODIFIERS,
  templateBuilderIsCustomToken,
} from "./template-builder-merge-field-library";

export type TemplateBuilderTokenScanSeverity = "blocking" | "warning" | "recognized";

export type TemplateBuilderTokenScanSection =
  | "Blocking Issues"
  | "Warnings"
  | "Recognized Tokens"
  | "No Tokens Found";

export type TemplateBuilderTokenLocationKind =
  | "Body paragraph"
  | "Table cell"
  | "Text box"
  | "Unknown document location";

export type TemplateBuilderTokenLocation = {
  kind: TemplateBuilderTokenLocationKind;
  label: string;
  paragraphIndex?: number;
  tableIndex?: number;
  rowIndex?: number;
  cellIndex?: number;
};

export type TemplateBuilderTokenScanIssueCode =
  | "recognized-token"
  | "unknown-well-formed-token"
  | "no-tokens-found"
  | "malformed-token"
  | "invalid-modifier-syntax"
  | "incompatible-field-type-modifier"
  | "split-different-style-warning";

export type TemplateBuilderTokenScanIssue = {
  severity: TemplateBuilderTokenScanSeverity;
  section: TemplateBuilderTokenScanSection;
  code: TemplateBuilderTokenScanIssueCode;
  tokenText: string;
  fieldLabel?: string;
  appliedFormats: string[];
  location: TemplateBuilderTokenLocation;
  suggestedToken?: string;
  message: string;
};

export type TemplateBuilderDocxScanBoundary = {
  includeBody: true;
  includeTables: true;
  includeTextBoxesWhenDetectable: true;
  ignoreHeaders: true;
  ignoreFooters: true;
  detectSplitAcrossWordRuns: true;
  warnWhenSplitAcrossDifferentlyStyledRuns: true;
};

export const TEMPLATE_BUILDER_DOCX_SCAN_BOUNDARY: TemplateBuilderDocxScanBoundary = {
  includeBody: true,
  includeTables: true,
  includeTextBoxesWhenDetectable: true,
  ignoreHeaders: true,
  ignoreFooters: true,
  detectSplitAcrossWordRuns: true,
  warnWhenSplitAcrossDifferentlyStyledRuns: true,
};

export const TEMPLATE_BUILDER_TOKEN_SCAN_POPUP_SECTIONS: TemplateBuilderTokenScanSection[] = [
  "Blocking Issues",
  "Warnings",
  "Recognized Tokens",
  "No Tokens Found",
];

export const TEMPLATE_BUILDER_TOKEN_SCAN_WARNING_ONLY_ACTIONS = [
  "Cancel",
  "Continue Anyway",
] as const;

export const TEMPLATE_BUILDER_TOKEN_SCAN_BLOCKING_ACTIONS = [
  "Close",
] as const;

export const TEMPLATE_BUILDER_TOKEN_PATTERN = /\{\{[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*(?:\|[a-zA-Z0-9: ,/]+)*\}\}/g;

export const TEMPLATE_BUILDER_TOKEN_LIKE_PATTERN = /\{\{[^}]*\}\}|\{[^}]*\}|\{\{[^}]*$/g;

export function templateBuilderCanonicalTokenMap() {
  return new Map(TEMPLATE_BUILDER_CANONICAL_MERGE_FIELDS.map((field) => [field.mergeField, field]));
}

export function templateBuilderLocationLabel(location: TemplateBuilderTokenLocation) {
  if (location.kind === "Body paragraph") return `Body paragraph ${location.paragraphIndex ?? "?"}`;
  if (location.kind === "Table cell") return `Table ${location.tableIndex ?? "?"}, row ${location.rowIndex ?? "?"}, cell ${location.cellIndex ?? "?"}`;
  if (location.kind === "Text box") return "Text box";
  return "Unknown document location";
}

export function templateBuilderParseTokenParts(tokenText: string) {
  const raw = String(tokenText || "").trim();
  if (!raw.startsWith("{{") || !raw.endsWith("}}")) {
    return { validEnvelope: false, baseToken: raw, modifiers: [] as string[] };
  }

  const inner = raw.slice(2, -2);
  const parts = inner.split("|").map((part) => part.trim()).filter(Boolean);
  const base = parts.shift() || "";
  return {
    validEnvelope: true,
    baseToken: "{{" + base + "}}",
    modifiers: parts,
  };
}

export function templateBuilderModifierSyntaxValid(modifier: string) {
  return TEMPLATE_BUILDER_SUPPORTED_FORMAT_MODIFIERS.includes(modifier as any);
}

export function templateBuilderNormalizeModifierOrder(modifiers: string[]) {
  const order = TEMPLATE_BUILDER_SUPPORTED_FORMAT_MODIFIERS;
  return Array.from(new Set(modifiers)).sort((a, b) => order.indexOf(a as any) - order.indexOf(b as any));
}

export function templateBuilderTokenWithNormalizedModifiers(tokenText: string) {
  const parsed = templateBuilderParseTokenParts(tokenText);
  if (!parsed.validEnvelope) return tokenText;
  const normalized = templateBuilderNormalizeModifierOrder(parsed.modifiers);
  if (normalized.length === 0) return parsed.baseToken;
  return parsed.baseToken.replace("}}", "|" + normalized.join("|") + "}}");
}

export function templateBuilderRecognizesToken(tokenText: string, customTokens: string[] = []) {
  const parsed = templateBuilderParseTokenParts(tokenText);
  if (!parsed.validEnvelope) return false;
  const canonical = templateBuilderCanonicalTokenMap();
  return canonical.has(parsed.baseToken) || customTokens.includes(parsed.baseToken) || templateBuilderIsCustomToken(parsed.baseToken);
}

export function templateBuilderFieldCompatibleWithModifiers(tokenText: string, customTokens: string[] = []) {
  const parsed = templateBuilderParseTokenParts(tokenText);
  if (!parsed.validEnvelope) return false;

  const canonical = templateBuilderCanonicalTokenMap();
  const field = canonical.get(parsed.baseToken);
  if (!field) return customTokens.includes(parsed.baseToken) || templateBuilderIsCustomToken(parsed.baseToken);

  return parsed.modifiers.every((modifier) => field.compatibleModifiers.includes(modifier as any));
}

export function templateBuilderClassifyTokenText(
  tokenText: string,
  location: TemplateBuilderTokenLocation,
  customTokens: string[] = [],
): TemplateBuilderTokenScanIssue {
  const token = String(tokenText || "").trim();
  const parsed = templateBuilderParseTokenParts(token);
  const canonical = templateBuilderCanonicalTokenMap();

  if (!parsed.validEnvelope || !/^\{\{[a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*(?:\|[^{}]+)*\}\}$/.test(token)) {
    return {
      severity: "blocking",
      section: "Blocking Issues",
      code: "malformed-token",
      tokenText: token,
      appliedFormats: [],
      location,
      suggestedToken: undefined,
      message: "Malformed token-like text is blocking because it will not merge reliably.",
    };
  }

  const invalidModifier = parsed.modifiers.find((modifier) => !templateBuilderModifierSyntaxValid(modifier));
  if (invalidModifier) {
    return {
      severity: "blocking",
      section: "Blocking Issues",
      code: "invalid-modifier-syntax",
      tokenText: token,
      appliedFormats: parsed.modifiers,
      location,
      suggestedToken: templateBuilderTokenWithNormalizedModifiers(parsed.baseToken),
      message: "Invalid modifier syntax is blocking.",
    };
  }

  const field = canonical.get(parsed.baseToken);
  const isCustom = customTokens.includes(parsed.baseToken) || templateBuilderIsCustomToken(parsed.baseToken);

  if (!field && !isCustom) {
    return {
      severity: "warning",
      section: "Warnings",
      code: "unknown-well-formed-token",
      tokenText: token,
      appliedFormats: parsed.modifiers,
      location,
      message: "Unknown but well-formed tokens are warning-only during seeding/edit readiness.",
    };
  }

  if (field && !templateBuilderFieldCompatibleWithModifiers(token, customTokens)) {
    return {
      severity: "blocking",
      section: "Blocking Issues",
      code: "incompatible-field-type-modifier",
      tokenText: token,
      fieldLabel: field.fieldLabel,
      appliedFormats: parsed.modifiers,
      location,
      suggestedToken: field.mergeField,
      message: "The token uses a modifier that is incompatible with the field type.",
    };
  }

  return {
    severity: "recognized",
    section: "Recognized Tokens",
    code: "recognized-token",
    tokenText: token,
    fieldLabel: field?.fieldLabel || "Custom manual placeholder",
    appliedFormats: parsed.modifiers,
    location,
    message: "Recognized token.",
  };
}

export function templateBuilderNoTokensFoundIssue(): TemplateBuilderTokenScanIssue {
  return {
    severity: "warning",
    section: "No Tokens Found",
    code: "no-tokens-found",
    tokenText: "",
    appliedFormats: [],
    location: { kind: "Unknown document location", label: "No tokens found" },
    message: "No tokens found is warning-only during seeding/edit readiness.",
  };
}

export function templateBuilderCanProceedWithScanIssues(issues: TemplateBuilderTokenScanIssue[]) {
  return issues.every((issue) => issue.severity !== "blocking");
}

export function templateBuilderActivationRequiresWarningOverride(issues: TemplateBuilderTokenScanIssue[]) {
  return issues.length > 0 && templateBuilderCanProceedWithScanIssues(issues) && issues.some((issue) => issue.severity === "warning");
}

export function templateBuilderGenerationBlocksOnScanIssues(issues: TemplateBuilderTokenScanIssue[]) {
  return issues.some((issue) => issue.severity === "blocking" || issue.code === "unknown-well-formed-token" || issue.code === "no-tokens-found");
}

export function templateBuilderSampleScanIssues() {
  return [
    templateBuilderClassifyTokenText("{{matter.fileNumber|bold}}", { kind: "Body paragraph", label: "Body paragraph 4", paragraphIndex: 4 }),
    templateBuilderClassifyTokenText("{{matter.dateOfService|currency}}", { kind: "Table cell", label: "Table 2, row 3, cell 1", tableIndex: 2, rowIndex: 3, cellIndex: 1 }),
    templateBuilderClassifyTokenText("{{unknown.safeToken}}", { kind: "Text box", label: "Text box" }),
    templateBuilderClassifyTokenText("{bad.token}", { kind: "Body paragraph", label: "Body paragraph 7", paragraphIndex: 7 }),
  ];
}
